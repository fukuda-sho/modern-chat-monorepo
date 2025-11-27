/**
 * @fileoverview Chat WebSocket Gateway
 * @description リアルタイムチャット機能を提供する WebSocket Gateway
 */

import { Logger, UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelMembershipService } from '../chat-rooms/channel-membership.service';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import {
  WsUser,
  JoinRoomPayload,
  LeaveRoomPayload,
  SendMessagePayload,
  GetOnlineUsersPayload,
  StartTypingPayload,
  StopTypingPayload,
  MessageCreatedPayload,
  RoomJoinedPayload,
  RoomLeftPayload,
  ErrorPayload,
  UserOnlinePayload,
  UserOfflinePayload,
  OnlineUsersListPayload,
  UserTypingPayload,
  MemberJoinedPayload,
  MemberLeftPayload,
} from './types/chat.types';

/**
 * Socket with user data の型定義
 */
interface AuthenticatedSocket extends Socket {
  data: {
    user: WsUser;
  };
}

/**
 * Chat Gateway クラス
 * @description WebSocket を通じたリアルタイムチャット機能を提供
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
})
@UseGuards(WsJwtAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  /**
   * 接続中ユーザーを管理する Map
   * key: userId, value: Set of socketIds（複数タブ対応）
   */
  private connectedUsers: Map<number, Set<string>> = new Map();

  /**
   * タイピング状態の自動タイムアウトを管理する Map
   * key: `${roomId}:${userId}`, value: Timeout
   */
  private typingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /**
   * タイピングタイムアウト時間（ミリ秒）
   * フロントエンドのデバウンス（5秒）より長く設定し、バックアップとして機能
   */
  private readonly TYPING_TIMEOUT_MS = 7000;

  /**
   * ChatGateway のコンストラクタ
   * @param {PrismaService} prisma - Prisma サービスインスタンス
   * @param {JwtService} jwtService - JWT サービスインスタンス
   * @param {ChannelMembershipService} membershipService - メンバーシップサービスインスタンス
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly membershipService: ChannelMembershipService,
  ) {}

  // ========================================
  // 接続・切断ハンドラ
  // ========================================

  /**
   * クライアント接続時の処理
   * - JWT トークンを検証してユーザー情報を設定
   * - connectedUsers に追加
   * - 初回接続時は全クライアントに userOnline を配信
   * @param {AuthenticatedSocket} client - 接続したクライアント
   */
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    // 接続時に JWT を検証してユーザー情報を設定
    const user = this.authenticateClient(client);
    if (!user) {
      this.logger.warn(`Unauthenticated client attempted to connect: ${client.id}`);
      client.disconnect();
      return;
    }
    client.data.user = user;

    const userId = user.userId;
    const socketId = client.id;

    // connectedUsers に追加
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    const userSockets = this.connectedUsers.get(userId)!;
    const isFirstConnection = userSockets.size === 0;
    userSockets.add(socketId);

    // ユーザー専用ルームに参加（メンション通知等で使用）
    client.join(`user:${userId}`);

    // 初回接続時のみオンライン通知を配信
    if (isFirstConnection) {
      this.server.emit('userOnline', {
        userId,
        username: user.username || user.email,
      } satisfies UserOnlinePayload);
    }

    this.logger.log(`Client connected: ${socketId}, User: ${userId}`);
  }

  /**
   * クライアント切断時の処理
   * - connectedUsers から削除
   * - 最後の接続が切れた場合は全クライアントに userOffline を配信
   * @param {AuthenticatedSocket} client - 切断したクライアント
   */
  handleDisconnect(client: AuthenticatedSocket): void {
    const user = client.data.user;
    if (!user) return;

    const userId = user.userId;
    const socketId = client.id;

    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);

      // 最後の接続が切れた場合
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);

        // オフライン通知を配信
        this.server.emit('userOffline', {
          userId,
        } satisfies UserOfflinePayload);
      }
    }

    // タイピング状態をクリア
    this.clearUserTyping(userId);

    this.logger.log(`Client disconnected: ${socketId}, User: ${userId}`);
  }

  // ========================================
  // ルーム参加・退出
  // ========================================

  /**
   * ルーム参加イベントハンドラ
   * @param {AuthenticatedSocket} client - 認証済みクライアント
   * @param {JoinRoomPayload} payload - ルーム参加ペイロード
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinRoomPayload,
  ): Promise<void> {
    const { roomId } = payload;
    const user = client.data.user;
    if (!user) return;

    // メンバーシップ確認
    const canAccess = await this.membershipService.canAccessChannel(user.userId, roomId);
    if (!canAccess) {
      client.emit('error', {
        message: 'このチャンネルにアクセスする権限がありません',
        code: 'CHANNEL_ACCESS_DENIED',
      } satisfies ErrorPayload);
      return;
    }

    client.join(roomId.toString());

    client.emit('roomJoined', { roomId } satisfies RoomJoinedPayload);

    this.logger.log(`User ${user.userId} joined room ${roomId}`);
  }

  /**
   * ルーム退出イベントハンドラ
   * @param {AuthenticatedSocket} client - 認証済みクライアント
   * @param {LeaveRoomPayload} payload - ルーム退出ペイロード
   */
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: LeaveRoomPayload,
  ): void {
    const { roomId } = payload;
    client.leave(roomId.toString());

    client.emit('roomLeft', { roomId } satisfies RoomLeftPayload);

    this.logger.log(`User ${client.data.user?.userId} left room ${roomId}`);
  }

  // ========================================
  // メッセージ送信
  // ========================================

  /**
   * メッセージ送信イベントハンドラ
   * @param {AuthenticatedSocket} client - 認証済みクライアント
   * @param {SendMessagePayload} payload - メッセージ送信ペイロード
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessagePayload,
  ): Promise<void> {
    const user = client.data.user;
    if (!user) return;

    const { roomId, content, localId } = payload;

    try {
      // メンバーシップ確認
      const canAccess = await this.membershipService.canAccessChannel(user.userId, roomId);
      if (!canAccess) {
        client.emit('error', {
          message: 'このチャンネルにメッセージを送信する権限がありません',
          code: 'CHANNEL_ACCESS_DENIED',
          localId,
        } satisfies ErrorPayload);
        return;
      }

      // DB にメッセージを保存
      const message = await this.prisma.message.create({
        data: {
          content,
          userId: user.userId,
          chatRoomId: roomId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      // タイピング状態をクリア
      const typingKey = `${roomId}:${user.userId}`;
      this.clearTypingTimeout(typingKey);

      // ルーム全体に配信（localId を含める）
      const messagePayload: MessageCreatedPayload = {
        id: message.id,
        roomId: message.chatRoomId,
        userId: message.userId,
        username: message.user.username || message.user.email,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        localId,
      };

      this.server.to(roomId.toString()).emit('messageCreated', messagePayload);
    } catch (error) {
      this.logger.error(`Failed to send message: ${error}`);

      // エラー時も localId を含めて通知
      client.emit('error', {
        message: 'メッセージの送信に失敗しました',
        code: 'MESSAGE_SEND_FAILED',
        localId,
      } satisfies ErrorPayload);
    }
  }

  // ========================================
  // プレゼンス
  // ========================================

  /**
   * オンラインユーザー一覧を取得
   * @param {AuthenticatedSocket} client - 認証済みクライアント
   * @param {GetOnlineUsersPayload} _payload - ペイロード（roomId オプション）
   */
  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() _payload: GetOnlineUsersPayload,
  ): void {
    // roomId が指定された場合はフィルタリング
    // 注: 現状はルームメンバーシップがないため、全ユーザーを返す
    // Phase 3 で RoomMember 実装後にフィルタリング追加
    const onlineUserIds = Array.from(this.connectedUsers.keys());

    client.emit('onlineUsersList', {
      userIds: onlineUserIds,
    } satisfies OnlineUsersListPayload);
  }

  /**
   * 指定ユーザーがオンラインかどうかを確認
   * @param {number} userId - ユーザー ID
   * @returns {boolean} オンラインなら true
   */
  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * オンラインユーザー数を取得
   * @returns {number} オンラインユーザー数
   */
  getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }

  // ========================================
  // タイピングインジケーター
  // ========================================

  /**
   * タイピング開始イベントハンドラ
   * - ルームの他メンバーに通知
   * - 5秒後に自動で停止
   * @param {AuthenticatedSocket} client - 認証済みクライアント
   * @param {StartTypingPayload} payload - タイピング開始ペイロード
   */
  @SubscribeMessage('startTyping')
  handleStartTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: StartTypingPayload,
  ): void {
    const user = client.data.user;
    if (!user) return;

    const { roomId } = payload;
    const userId = user.userId;
    const key = `${roomId}:${userId}`;

    // 既存のタイムアウトをクリア
    this.clearTypingTimeout(key);

    // ルームの他メンバーに通知（自分以外）
    client.to(roomId.toString()).emit('userTyping', {
      roomId,
      userId,
      username: user.username || user.email,
      isTyping: true,
    } satisfies UserTypingPayload);

    // 5秒後に自動でタイピング停止
    const timeout = setTimeout(() => {
      this.emitStopTyping(client, roomId, userId, user.username || user.email);
      this.typingTimeouts.delete(key);
    }, this.TYPING_TIMEOUT_MS);

    this.typingTimeouts.set(key, timeout);
  }

  /**
   * タイピング終了イベントハンドラ
   * @param {AuthenticatedSocket} client - 認証済みクライアント
   * @param {StopTypingPayload} payload - タイピング終了ペイロード
   */
  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: StopTypingPayload,
  ): void {
    const user = client.data.user;
    if (!user) return;

    const { roomId } = payload;
    const userId = user.userId;
    const key = `${roomId}:${userId}`;

    // タイムアウトをクリア
    this.clearTypingTimeout(key);

    // タイピング停止を通知
    this.emitStopTyping(client, roomId, userId, user.username || user.email);
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  /**
   * タイピング停止を配信
   * @param {AuthenticatedSocket} client - クライアント
   * @param {number} roomId - ルーム ID
   * @param {number} userId - ユーザー ID
   * @param {string} username - ユーザー名
   */
  private emitStopTyping(
    client: AuthenticatedSocket,
    roomId: number,
    userId: number,
    username: string,
  ): void {
    client.to(roomId.toString()).emit('userTyping', {
      roomId,
      userId,
      username,
      isTyping: false,
    } satisfies UserTypingPayload);
  }

  /**
   * タイピングタイムアウトをクリア
   * @param {string} key - タイムアウトキー（`${roomId}:${userId}`）
   */
  private clearTypingTimeout(key: string): void {
    const existingTimeout = this.typingTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(key);
    }
  }

  /**
   * ユーザーの全タイピング状態をクリア（切断時に使用）
   * @param {number} userId - ユーザー ID
   */
  private clearUserTyping(userId: number): void {
    for (const [key, timeout] of this.typingTimeouts.entries()) {
      if (key.endsWith(`:${userId}`)) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(key);
      }
    }
  }

  /**
   * クライアントの JWT トークンを検証してユーザー情報を返す
   * @param {Socket} client - Socket.IO クライアント
   * @returns {WsUser | null} ユーザー情報、認証失敗時は null
   */
  private authenticateClient(client: Socket): WsUser | null {
    const token = this.extractToken(client);
    if (!token) {
      return null;
    }

    try {
      const payload = this.jwtService.verify<{ sub: number; email: string }>(token);
      return {
        userId: payload.sub,
        email: payload.email,
      };
    } catch {
      this.logger.debug(`JWT verification failed for client: ${client.id}`);
      return null;
    }
  }

  /**
   * ソケットから JWT トークンを抽出する
   * @param {Socket} client - Socket.IO クライアント
   * @returns {string | null} 抽出されたトークン、または null
   */
  private extractToken(client: Socket): string | null {
    // 1. auth フィールドから取得（推奨）
    const authToken = client.handshake.auth?.token as string | undefined;
    if (authToken) {
      return this.parseBearer(authToken);
    }

    // 2. Authorization ヘッダから取得
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader) {
      return this.parseBearer(authHeader);
    }

    // 3. クエリパラメータから取得（フォールバック）
    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }

  /**
   * Bearer トークン形式からトークン部分を抽出する
   * @param {string} value - Bearer トークン文字列
   * @returns {string | null} トークン部分、または null
   */
  private parseBearer(value: string): string | null {
    if (value.startsWith('Bearer ')) {
      return value.substring(7);
    }
    return value;
  }

  // ========================================
  // メンバーシップイベント配信
  // ========================================

  /**
   * メンバー参加イベントを配信
   * @param {number} roomId - ルーム ID
   * @param {number} userId - 参加したユーザー ID
   * @param {string} username - ユーザー名
   */
  emitMemberJoined(roomId: number, userId: number, username: string): void {
    this.server.to(roomId.toString()).emit('memberJoined', {
      roomId,
      userId,
      username,
    } satisfies MemberJoinedPayload);
  }

  /**
   * メンバー退出イベントを配信
   * @param {number} roomId - ルーム ID
   * @param {number} userId - 退出したユーザー ID
   * @param {string} username - ユーザー名
   * @param {boolean} kicked - キックされた場合は true
   */
  emitMemberLeft(roomId: number, userId: number, username: string, kicked = false): void {
    this.server.to(roomId.toString()).emit('memberLeft', {
      roomId,
      userId,
      username,
      kicked,
    } satisfies MemberLeftPayload);
  }
}
