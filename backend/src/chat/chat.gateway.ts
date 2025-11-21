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

interface ChatUser {
  username: string;
  sub: number;
}

interface SocketWithAuth extends Socket {
  data: {
    user?: ChatUser;
  };
}

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

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

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
