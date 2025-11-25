/**
 * @fileoverview Chat WebSocket Gateway
 * @description リアルタイムチャット機能を提供する WebSocket Gateway
 */

import { UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import {
  WsUser,
  JoinRoomPayload,
  LeaveRoomPayload,
  SendMessagePayload,
  MessageCreatedPayload,
  RoomJoinedPayload,
  RoomLeftPayload,
  ErrorPayload,
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
    origin: [
      'http://localhost:3000', // フロントエンド開発環境
      // 本番環境の URL を追加する場合はここに記載
    ],
    credentials: true,
  },
})
@UseGuards(WsJwtAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  /**
   * ChatGateway のコンストラクタ
   * @param {PrismaService} prisma - Prisma サービスインスタンス
   */
  constructor(private prisma: PrismaService) {}

  /**
   * クライアント接続時のハンドラ
   * @param {Socket} client - 接続したクライアント
   */
  handleConnection(client: Socket): void {
    // eslint-disable-next-line no-console
    console.log(`Client connected: ${client.id}`);
  }

  /**
   * クライアント切断時のハンドラ
   * @param {Socket} client - 切断したクライアント
   */
  handleDisconnect(client: Socket): void {
    // eslint-disable-next-line no-console
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * ルーム参加イベントハンドラ
   * @param {AuthenticatedSocket} client - 認証済みクライアント
   * @param {JoinRoomPayload} payload - ルーム参加ペイロード
   * @returns {RoomJoinedPayload} ルーム参加完了レスポンス
   */
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinRoomPayload,
  ): RoomJoinedPayload {
    const roomName = payload.roomId.toString();
    client.join(roomName);

    // eslint-disable-next-line no-console
    console.log(`User ${client.data.user.userId} joined room ${payload.roomId}`);

    const response: RoomJoinedPayload = { roomId: payload.roomId };
    client.emit('roomJoined', response);

    return response;
  }

  /**
   * ルーム退出イベントハンドラ
   * @param {AuthenticatedSocket} client - 認証済みクライアント
   * @param {LeaveRoomPayload} payload - ルーム退出ペイロード
   * @returns {RoomLeftPayload} ルーム退出完了レスポンス
   */
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: LeaveRoomPayload,
  ): RoomLeftPayload {
    const roomName = payload.roomId.toString();
    client.leave(roomName);

    // eslint-disable-next-line no-console
    console.log(`User ${client.data.user.userId} left room ${payload.roomId}`);

    const response: RoomLeftPayload = { roomId: payload.roomId };
    client.emit('roomLeft', response);

    return response;
  }

  /**
   * メッセージ送信イベントハンドラ
   * @param {AuthenticatedSocket} client - 認証済みクライアント
   * @param {SendMessagePayload} payload - メッセージ送信ペイロード
   * @returns {Promise<MessageCreatedPayload | void>} 作成されたメッセージ、またはエラー時は void
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessagePayload,
  ): Promise<MessageCreatedPayload | void> {
    const user = client.data.user;

    try {
      // DB にメッセージを保存
      const message = await this.prisma.message.create({
        data: {
          content: payload.content,
          userId: user.userId,
          chatRoomId: payload.roomId,
        },
      });

      // 保存成功時のレスポンスを作成
      const messagePayload: MessageCreatedPayload = {
        id: message.id,
        roomId: payload.roomId,
        userId: user.userId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      };

      // ルーム内の全クライアントにブロードキャスト
      const roomName = payload.roomId.toString();
      this.server.to(roomName).emit('messageCreated', messagePayload);

      return messagePayload;
    } catch (error) {
      // DB 保存失敗時はエラーを送信者のみに通知
      const errorPayload: ErrorPayload = {
        message: 'Failed to save message',
        code: 'MESSAGE_SAVE_FAILED',
      };
      client.emit('error', errorPayload);

      // eslint-disable-next-line no-console
      console.error('Failed to save message:', error);
    }
  }
}
