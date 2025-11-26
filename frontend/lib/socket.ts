/**
 * WebSocket サービス
 * Socket.IO クライアントの管理とイベント処理
 */

import { io, Socket } from 'socket.io-client';
import { WS_URL, RECONNECT_CONFIG, AUTH_TOKEN_KEY } from './constants';
import { useChatStore } from '@/features/chat/store/chat-store';
import type {
  MessageCreatedPayload,
  RoomJoinedPayload,
  RoomLeftPayload,
  ErrorPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  SendMessagePayload,
} from '@/types';

/**
 * サーバー → クライアント イベント型
 */
interface ServerToClientEvents {
  roomJoined: (payload: RoomJoinedPayload) => void;
  roomLeft: (payload: RoomLeftPayload) => void;
  messageCreated: (payload: MessageCreatedPayload) => void;
  error: (payload: ErrorPayload) => void;
}

/**
 * クライアント → サーバー イベント型
 */
interface ClientToServerEvents {
  joinRoom: (payload: JoinRoomPayload) => void;
  leaveRoom: (payload: LeaveRoomPayload) => void;
  sendMessage: (payload: SendMessagePayload) => void;
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
    });

    // メッセージ受信
    this.socket.on('messageCreated', (payload) => {
      console.log('[Socket] Message received:', payload);
      useChatStore.getState().addMessage(payload.roomId, {
        id: payload.id,
        roomId: payload.roomId,
        userId: payload.userId,
        content: payload.content,
        createdAt: payload.createdAt,
      });
    });

    // エラー
    this.socket.on('error', (payload) => {
      console.error('[Socket] Error:', payload.message);
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
  sendMessage(roomId: number, content: string): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected, cannot send message');
      return;
    }
    this.socket.emit('sendMessage', { roomId, content });
  }

  /**
   * 接続状態を取得
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// シングルトンインスタンスをエクスポート
export const socketService = new SocketService();
