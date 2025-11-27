/**
 * @fileoverview チャットルームモジュール
 * @description チャットルーム機能を提供するモジュール
 */

import { Module } from '@nestjs/common';
import { ChatRoomsController } from './chat-rooms.controller';
import { ChatRoomsService } from './chat-rooms.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * チャットルームモジュールクラス
 * @description チャットルームの作成・取得機能を提供
 */
@Module({
  imports: [PrismaModule],
  controllers: [ChatRoomsController],
  providers: [ChatRoomsService],
  exports: [ChatRoomsService],
})
export class ChatRoomsModule {}
