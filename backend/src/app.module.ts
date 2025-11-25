/**
 * @fileoverview アプリケーションのルートモジュール
 * @description 全てのモジュールを統合するルートモジュール
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';

/**
 * アプリケーションのルートモジュール
 * @description PrismaModule, AuthModule, UsersModule, HealthModule をインポートする
 */
@Module({
  imports: [PrismaModule, AuthModule, UsersModule, HealthModule],
})
export class AppModule {}
