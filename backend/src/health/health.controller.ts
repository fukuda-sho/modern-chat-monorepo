/**
 * @fileoverview ヘルスチェックコントローラー
 * @description /health エンドポイントのルーティングを定義
 */

import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { HealthService, HealthCheckResult } from './health.service';

/**
 * ヘルスチェックコントローラークラス
 * @description アプリケーションのヘルスチェックエンドポイントを提供
 */
@Controller('health')
export class HealthController {
  /**
   * HealthController のコンストラクタ
   * @param {HealthService} healthService - ヘルスチェックサービスインスタンス
   */
  constructor(private healthService: HealthService) {}

  /**
   * ヘルスチェックを実行する
   * @description アプリケーションと依存コンポーネントの稼働状況を返却
   * @returns {Promise<HealthCheckResult>} ヘルスチェック結果
   * @throws {HttpException} 依存コンポーネントに障害がある場合は 503 を返却
   */
  @Get()
  async check(): Promise<HealthCheckResult> {
    const result = await this.healthService.checkHealth();

    // 異常がある場合は 503 Service Unavailable を返却
    if (result.status === 'error') {
      throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return result;
  }
}
