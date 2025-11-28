/**
 * @fileoverview チャットルームモジュール
 * @description チャットルーム機能を提供するモジュール
 */

import { Module } from '@nestjs/common';
import { ChatRoomsController } from './chat-rooms.controller';
import { ChatRoomsService } from './chat-rooms.service';
import { ChannelMembershipService } from './channel-membership.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * チャットルームモジュールクラス
 * @description チャットルームの作成・取得・メンバーシップ管理機能を提供
 */
@Module({
  imports: [PrismaModule],
  controllers: [ChatRoomsController],
  providers: [ChatRoomsService, ChannelMembershipService],
  exports: [ChatRoomsService, ChannelMembershipService],
})
export class ChatRoomsModule {}
