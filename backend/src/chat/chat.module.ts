/**
 * @fileoverview Chat モジュール
 * @description WebSocket チャット機能を提供するモジュール
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { ChatRoomsModule } from '../chat-rooms/chat-rooms.module';

/**
 * Chat モジュールクラス
 * @description ChatGateway と認証 Guard を提供
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
  providers: [ChatGateway, WsJwtAuthGuard],
})
export class ChatModule {}
