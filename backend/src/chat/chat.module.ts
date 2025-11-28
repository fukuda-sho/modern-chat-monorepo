/**
 * @fileoverview Chat モジュール
 * @description WebSocket チャット機能と REST API を提供するモジュール
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { ChatRoomsModule } from '../chat-rooms/chat-rooms.module';

/**
 * Chat モジュールクラス
 * @description ChatGateway、ChatController、ChatService を提供
 */
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: {
        expiresIn: '1h',
      },
    }),
    ChatRoomsModule,
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, WsJwtAuthGuard],
  exports: [ChatService],
})
export class ChatModule {}
