/**
 * @fileoverview ヘルスチェックモジュール
 * @description ヘルスチェック関連のコンポーネントを束ねるモジュール
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * ヘルスチェックモジュールクラス
 * @description ヘルスチェック機能を提供するモジュール
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
