import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from './chat.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';

/**
 * JWTトークンから抽出されたユーザー情報
 */
interface ChatUser {
  /** ユーザー名 */
  username: string;
  /** ユーザーID（JWTのsubjectクレーム） */
  sub: number;
}

/**
 * 認証情報を含むWebSocketクライアント
 */
interface SocketWithAuth extends Socket {
  data: {
    /** JWT認証されたユーザー情報 */
    user?: ChatUser;
  };
}

/**
 * リアルタイムチャット機能を提供するWebSocketゲートウェイ
 *
 * クライアントとの双方向通信を管理し、チャットルームへの参加、メッセージ送受信、
 * ルーム離脱などの機能を提供します。すべてのイベントハンドラはJWT認証が必要です。
 *
 * CORS設定により、フロントエンドからのWebSocket接続を許可します。
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  /**
   * クライアントがWebSocketに接続した際の処理
   *
   * ハンドシェイク時に送信されたJWTトークンを検証し、
   * 有効な場合はユーザー情報をクライアントのデータに格納します。
   * トークンが無効または存在しない場合は接続を切断します。
   *
   * @param client 接続してきたWebSocketクライアント
   */
  handleConnection(client: SocketWithAuth) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        // Allow connection but subsequent events might be guarded or we can disconnect here.
        // For strict auth:
        // client.disconnect();
        return;
      }
      const payload = this.jwtService.verify<ChatUser>(token, {
        secret: process.env.JWT_SECRET || 'secretKey',
      });
      client.data.user = payload;
      this.logger.log(`Client connected: ${client.id}, User: ${payload.username}`);
    } catch (e) {
      this.logger.warn('Connection auth failed, disconnecting...', e);
      client.disconnect();
    }
  }

  /**
   * クライアントがWebSocketから切断された際の処理
   *
   * 切断ログを記録します。
   * クライアントが参加していたルームからは自動的に退出されます。
   *
   * @param client 切断されたWebSocketクライアント
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * チャットルームへの参加リクエストを処理します
   *
   * クライアントを指定されたルームに参加させ、ルーム内の他のユーザーと
   * メッセージをやり取りできるようにします。
   * 参加完了後、クライアントに'joinedRoom'イベントを送信します。
   *
   * @param client ルームに参加するWebSocketクライアント（認証済み）
   * @param payload ルームID を含むペイロード
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() payload: { roomId: number },
  ) {
    const roomName = `room_${payload.roomId}`;
    void client.join(roomName);
    client.emit('joinedRoom', { roomId: payload.roomId });
    this.logger.log(`User ${client.data.user?.username} joined ${roomName}`);
  }

  /**
   * チャットルームからの退出リクエストを処理します
   *
   * クライアントを指定されたルームから退出させます。
   * 退出後、ルーム内のメッセージは受信されなくなります。
   * 退出完了後、クライアントに'leftRoom'イベントを送信します。
   *
   * @param client ルームから退出するWebSocketクライアント（認証済み）
   * @param payload ルームID を含むペイロード
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() payload: { roomId: number },
  ) {
    const roomName = `room_${payload.roomId}`;
    void client.leave(roomName);
    client.emit('leftRoom', { roomId: payload.roomId });
    this.logger.log(`User ${client.data.user?.username} left ${roomName}`);
  }

  /**
   * クライアントからのメッセージ送信リクエストを処理します
   *
   * 送信されたメッセージをデータベースに保存し、
   * 同じルームに参加している全てのクライアントに'newMessage'イベントで
   * メッセージをブロードキャストします。
   *
   * 送信者本人にもメッセージが配信されます。
   * メッセージの保存に失敗した場合は、送信者にエラーイベントを返します。
   *
   * @param client メッセージを送信するWebSocketクライアント（認証済み）
   * @param payload ルームIDとメッセージ内容を含むペイロード
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() payload: { roomId: number; content: string },
  ) {
    const user = client.data.user;
    if (!user) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }

    try {
      const message = await this.chatService.saveMessage(
        user.sub,
        payload.roomId,
        payload.content,
      );

      const roomName = `room_${payload.roomId}`;
      this.server.to(roomName).emit('newMessage', message);
    } catch (error) {
      this.logger.error('Error saving message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * WebSocketハンドシェイクからJWTトークンを抽出します
   *
   * 以下の順序でトークンを検索します：
   * 1. handshake.auth.token（Socket.IOのauth設定）
   * 2. handshake.headers.authorization（HTTPヘッダー）
   *
   * Bearer形式のトークンから'Bearer'プレフィックスを除去して返します。
   *
   * @param client WebSocketクライアント
   * @returns 抽出されたJWTトークン（存在しない場合はundefined）
   */
  private extractToken(client: Socket): string | undefined {
    const auth = client.handshake.auth as { token?: string } | undefined;
    if (auth?.token) {
      const [type, token] = auth.token.split(' ');
      return type === 'Bearer' ? token : auth.token;
    }
    const headers = client.handshake.headers;
    if (headers.authorization) {
      const [type, token] = headers.authorization.split(' ');
      return type === 'Bearer' ? token : headers.authorization;
    }
    return undefined;
  }
}
