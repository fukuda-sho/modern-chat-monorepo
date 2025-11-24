/**
 * @fileoverview ユーザーモジュール
 * @description ユーザー関連のコンポーネントを束ねるモジュール
 */

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * ユーザーモジュールクラス
 * @description ユーザー情報取得機能を提供
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
