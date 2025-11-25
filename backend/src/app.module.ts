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

/**
 * アプリケーションのルートモジュール
 * @description PrismaModule, AuthModule, UsersModule, HealthModule, ChatModule をインポートする
 */
@Module({
  imports: [PrismaModule, AuthModule, UsersModule, HealthModule, ChatModule],
})
export class AppModule {}
