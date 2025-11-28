/**
 * WebSocket サービス
 * Socket.IO クライアントの管理とイベント処理
 */

import { io, Socket } from 'socket.io-client';
import { WS_URL, RECONNECT_CONFIG, AUTH_TOKEN_KEY } from './constants';
import { getQueryClient } from './query-client';
import { useChatStore } from '@/features/chat/store/chat-store';
import { usePresenceStore } from '@/features/presence/store/presence-store';
import { roomMessagesKeys } from '@/features/chat/hooks/use-room-messages';
import type {
  MessageCreatedPayload,
  RoomJoinedPayload,
  RoomLeftPayload,
  ErrorPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  SendMessagePayload,
  UserOnlinePayload,
  UserOfflinePayload,
  OnlineUsersListPayload,
  UserTypingPayload,
  GetOnlineUsersPayload,
  StartTypingPayload,
  StopTypingPayload,
  Message,
  MessageHistoryResponse,
} from '@/types';

/**
 * サーバー → クライアント イベント型
 */
interface ServerToClientEvents {
  roomJoined: (payload: RoomJoinedPayload) => void;
  roomLeft: (payload: RoomLeftPayload) => void;
  messageCreated: (payload: MessageCreatedPayload) => void;
  error: (payload: ErrorPayload) => void;
  userOnline: (payload: UserOnlinePayload) => void;
  userOffline: (payload: UserOfflinePayload) => void;
  onlineUsersList: (payload: OnlineUsersListPayload) => void;
  userTyping: (payload: UserTypingPayload) => void;
}

/**
 * クライアント → サーバー イベント型
 */
interface ClientToServerEvents {
  joinRoom: (payload: JoinRoomPayload) => void;
  leaveRoom: (payload: LeaveRoomPayload) => void;
  sendMessage: (payload: SendMessagePayload) => void;
  getOnlineUsers: (payload: GetOnlineUsersPayload) => void;
  startTyping: (payload: StartTypingPayload) => void;
  stopTyping: (payload: StopTypingPayload) => void;
}

/**
 * WebSocket 接続管理サービス
 * シングルトンパターンで実装
 */
class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * WebSocket 接続を開始
   * @param token - JWT アクセストークン
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    useChatStore.getState().setConnectionStatus('connecting');

    this.socket = io(WS_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: false, // 手動で再接続を制御
    });

    this.setupEventListeners();
  }

  /**
   * 保存されたトークンで接続を開始
   */
  connectWithStoredToken(): void {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      this.connect(token);
    }
  }

  /**
   * WebSocket 接続を切断
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.reconnectAttempts = 0;
    useChatStore.getState().setConnectionStatus('disconnected');
    usePresenceStore.getState().reset();
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 接続成功
    this.socket.on('connect', () => {
      console.log('[Socket] Connected');
      this.reconnectAttempts = 0;
      useChatStore.getState().setConnectionStatus('connected');

      // 接続成功時にオンラインユーザー一覧を取得
      this.getOnlineUsers();
    });

    // 切断
    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      useChatStore.getState().setConnectionStatus('disconnected');

      // サーバー側からの意図的な切断でなければ再接続
      if (reason !== 'io server disconnect') {
        this.attemptReconnect();
      }
    });

    // 接続エラー
    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      useChatStore.getState().setConnectionStatus('disconnected');
      this.attemptReconnect();
    });

    // ルーム参加完了
    this.socket.on('roomJoined', (payload) => {
      console.log('[Socket] Joined room:', payload.roomId);
      useChatStore.getState().setCurrentRoom(payload.roomId);
    });

    // ルーム退出完了
    this.socket.on('roomLeft', (payload) => {
      console.log('[Socket] Left room:', payload.roomId);
      const currentRoom = useChatStore.getState().currentRoomId;
      if (currentRoom === payload.roomId) {
        useChatStore.getState().setCurrentRoom(null);
      }
      // ルーム退出時にタイピング状態をクリア
      usePresenceStore.getState().clearTypingForRoom(payload.roomId);
    });

    // メッセージ受信
    this.socket.on('messageCreated', (payload) => {
      console.log('[Socket] Message received:', payload);

      const message: Message = {
        id: payload.id,
        roomId: payload.roomId,
        userId: payload.userId,
        username: payload.username,
        content: payload.content,
        createdAt: payload.createdAt,
        localId: payload.localId,
      };

      // TanStack Query キャッシュを更新
      this.updateQueryCache(payload.roomId, message, payload.localId);

      // Zustand ストアも更新（後方互換性のため）
      if (payload.localId) {
        useChatStore.getState().confirmMessage(payload.roomId, payload.localId, message);
      } else {
        useChatStore.getState().addMessage(payload.roomId, message);
      }
    });

    // エラー
    this.socket.on('error', (payload) => {
      console.error('[Socket] Error:', payload.message);

      // localId があればオプティミスティック更新の失敗処理
      if (payload.localId) {
        const currentRoomId = useChatStore.getState().currentRoomId;
        if (currentRoomId) {
          useChatStore.getState().failMessage(currentRoomId, payload.localId);
        }
      }
    });

    // ========================================
    // プレゼンスイベント
    // ========================================

    // ユーザーオンライン
    this.socket.on('userOnline', (payload) => {
      console.log('[Socket] User online:', payload.userId);
      usePresenceStore.getState().setUserOnline(payload.userId);
    });

    // ユーザーオフライン
    this.socket.on('userOffline', (payload) => {
      console.log('[Socket] User offline:', payload.userId);
      usePresenceStore.getState().setUserOffline(payload.userId);
    });

    // オンラインユーザー一覧
    this.socket.on('onlineUsersList', (payload) => {
      console.log('[Socket] Online users:', payload.userIds);
      usePresenceStore.getState().setOnlineUsers(payload.userIds);
    });

    // ========================================
    // タイピングイベント
    // ========================================

    // タイピング状態
    this.socket.on('userTyping', (payload) => {
      console.log('[Socket] User typing:', payload);
      usePresenceStore.getState().setUserTyping(
        payload.roomId,
        payload.userId,
        payload.username,
        payload.isTyping
      );
    });
  }

  /**
   * 再接続を試行（Exponential Backoff）
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= RECONNECT_CONFIG.maxAttempts) {
      console.error('[Socket] Max reconnection attempts reached');
      useChatStore.getState().setConnectionStatus('error');
      return;
    }

    const delay = Math.min(
      RECONNECT_CONFIG.baseDelay *
        Math.pow(RECONNECT_CONFIG.multiplier, this.reconnectAttempts),
      RECONNECT_CONFIG.maxDelay
    );

    console.log(
      `[Socket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.socket?.connect();
    }, delay);
  }

  /**
   * ルームに参加
   */
  joinRoom(roomId: number): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected, cannot join room');
      return;
    }
    this.socket.emit('joinRoom', { roomId });
  }

  /**
   * ルームから退出
   */
  leaveRoom(roomId: number): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected, cannot leave room');
      return;
    }
    this.socket.emit('leaveRoom', { roomId });
  }

  /**
   * メッセージを送信
   */
  sendMessage(roomId: number, content: string, localId?: string): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected, cannot send message');
      return;
    }
    this.socket.emit('sendMessage', { roomId, content, localId });
  }

  /**
   * オンラインユーザー一覧を要求
   */
  getOnlineUsers(roomId?: number): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected, cannot get online users');
      return;
    }
    this.socket.emit('getOnlineUsers', { roomId });
  }

  /**
   * タイピング開始を通知
   */
  startTyping(roomId: number): void {
    if (!this.socket?.connected) return;
    this.socket.emit('startTyping', { roomId });
  }

  /**
   * タイピング終了を通知
   */
  stopTyping(roomId: number): void {
    if (!this.socket?.connected) return;
    this.socket.emit('stopTyping', { roomId });
  }

  /**
   * 接続状態を取得
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * TanStack Query キャッシュを更新
   * @param roomId ルームID
   * @param message メッセージ
   * @param localId ローカルID（オプティミスティック更新用）
   */
  private updateQueryCache(roomId: number, message: Message, localId?: string): void {
    const queryClient = getQueryClient();

    queryClient.setQueryData<{
      pages: MessageHistoryResponse[];
      pageParams: (number | undefined)[];
    }>(roomMessagesKeys.room(roomId), (oldData) => {
      if (!oldData) {
        // キャッシュがない場合は新しいページを作成
        return {
          pages: [
            {
              data: [message],
              pagination: { hasMore: false, nextCursor: null, prevCursor: null },
            },
          ],
          pageParams: [undefined],
        };
      }

      // localId がある場合はオプティミスティック更新の確定
      if (localId) {
        const newPages = oldData.pages.map((page) => ({
          ...page,
          data: page.data.map((msg) =>
            msg.localId === localId ? { ...message, isPending: false } : msg,
          ),
        }));

        return {
          ...oldData,
          pages: newPages,
        };
      }

      // 新着メッセージを最初のページに追加
      const newPages = [...oldData.pages];
      if (newPages.length > 0) {
        // 重複チェック
        const allMessages = newPages.flatMap((p) => p.data);
        if (allMessages.some((m) => m.id === message.id)) {
          return oldData;
        }

        newPages[0] = {
          ...newPages[0],
          data: [...newPages[0].data, message],
        };
      }

      return {
        ...oldData,
        pages: newPages,
      };
    });
  }
}

// シングルトンインスタンスをエクスポート
export const socketService = new SocketService();
