/**
 * @fileoverview アプリケーションのルートモジュール
 * @description 全てのモジュールを統合するルートモジュール
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { ChatModule } from './chat/chat.module';
import { ChatRoomsModule } from './chat-rooms/chat-rooms.module';

/**
 * アプリケーションのルートモジュール
 * @description PrismaModule, AuthModule, UsersModule, HealthModule, ChatModule, ChatRoomsModule をインポートする
 */
@Module({
  imports: [PrismaModule, AuthModule, UsersModule, HealthModule, ChatModule, ChatRoomsModule],
})
export class AppModule {}
