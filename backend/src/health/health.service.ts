/**
 * @fileoverview ヘルスチェックサービス
 * @description アプリケーションおよび依存コンポーネントの稼働状況を確認する
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 個別コンポーネントの状態
 */
type ComponentStatus = 'up' | 'down';

/**
 * 全体ステータス
 */
type OverallStatus = 'ok' | 'error';

/**
 * ヘルスチェック結果の型定義
 */
export interface HealthCheckResult {
  /** 全体ステータス */
  status: OverallStatus;
  /** サーバー側での現在時刻（ISO 8601形式） */
  timestamp: string;
  /** 個別コンポーネントの状態 */
  checks: {
    /** アプリケーションプロセスの状態 */
    app: ComponentStatus;
    /** データベース接続の状態 */
    db: ComponentStatus;
  };
}

/**
 * ヘルスチェックサービスクラス
 * @description アプリケーションと依存コンポーネントの稼働確認ロジックを提供
 */
@Injectable()
export class HealthService {
  /**
   * HealthService のコンストラクタ
   * @param {PrismaService} prisma - Prisma サービスインスタンス
   */
  constructor(private prisma: PrismaService) {}

  /**
   * 全体のヘルスチェックを実行する
   * @description アプリケーションと DB の稼働状況を確認し、結果を返却
   * @returns {Promise<HealthCheckResult>} ヘルスチェック結果
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const dbStatus = await this.checkDatabase();

    // アプリはこのメソッドが呼べている時点で稼働中
    const appStatus: ComponentStatus = 'up';

    // 全チェック項目が正常かどうかで全体ステータスを決定
    const isHealthy = appStatus === 'up' && dbStatus === 'up';
    const status: OverallStatus = isHealthy ? 'ok' : 'error';

    return {
      status,
      timestamp,
      checks: {
        app: appStatus,
        db: dbStatus,
      },
    };
  }

  /**
   * データベース接続を確認する
   * @description Prisma 経由で SELECT 1 を実行し、DB への疎通を確認
   * @returns {Promise<ComponentStatus>} DB の状態（'up' または 'down'）
   */
  private async checkDatabase(): Promise<ComponentStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }
}
