/**
 * @fileoverview ヘルスチェックコントローラー
 * @description /health エンドポイントのルーティングを定義
 */

import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthCheckResult } from './health.service';
import { ServiceUnavailableResponseDto } from '../common/dto';

/**
 * ヘルスチェックコントローラークラス
 * @description アプリケーションのヘルスチェックエンドポイントを提供
 */
@ApiTags('health')
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
  @ApiOperation({
    summary: 'ヘルスチェック',
    description: 'アプリケーションと依存コンポーネント（DB など）の稼働状況を確認します。',
  })
  @ApiResponse({
    status: 200,
    description: 'サーバー正常稼働',
  })
  @ApiResponse({
    status: 503,
    description: '依存コンポーネントに障害あり',
    type: ServiceUnavailableResponseDto,
  })
  async check(): Promise<HealthCheckResult> {
    const result = await this.healthService.checkHealth();

    // 異常がある場合は 503 Service Unavailable を返却
    if (result.status === 'error') {
      throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return result;
  }
}
