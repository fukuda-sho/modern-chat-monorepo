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
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
        const token = this.extractToken(client);
        if (!token) {
           // Allow connection but subsequent events might be guarded or we can disconnect here.
           // For strict auth:
           // client.disconnect();
           return;
        }
        const payload = this.jwtService.verify(token, {
            secret: process.env.JWT_SECRET || 'secretKey',
        });
        client.data.user = payload;
        console.log(`Client connected: ${client.id}, User: ${payload.username}`);
    } catch (e) {
        console.log('Connection auth failed, disconnecting...', e);
        client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: number },
  ) {
    const roomName = `room_${payload.roomId}`;
    client.join(roomName);
    client.emit('joinedRoom', { roomId: payload.roomId });
    console.log(`User ${client.data.user?.username} joined ${roomName}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: number },
  ) {
    const roomName = `room_${payload.roomId}`;
    client.leave(roomName);
    client.emit('leftRoom', { roomId: payload.roomId });
    console.log(`User ${client.data.user?.username} left ${roomName}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
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
      console.error('Error saving message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  private extractToken(client: Socket): string | undefined {
      const auth = client.handshake.auth;
      if (auth && auth.token) {
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
