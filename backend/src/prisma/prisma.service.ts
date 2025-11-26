/**
 * @fileoverview Prisma サービス
 * @description PrismaClient をラップし、DB 接続のライフサイクルを管理する
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma サービスクラス
 * @description PrismaClient を継承し、NestJS のライフサイクルフックに対応
 * @extends PrismaClient
 * @implements {OnModuleInit}
 * @implements {OnModuleDestroy}
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * PrismaService のコンストラクタ
   * @description 標準の Prisma MySQL 接続を使用して初期化
   * DATABASE_URL は schema.prisma の env("DATABASE_URL") から読み取られる
   */
  constructor() {
    super();
  }

  /**
   * モジュール初期化時にデータベースへ接続
   * @returns {Promise<void>} 接続完了時に解決される Promise
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  /**
   * モジュール破棄時にデータベース接続を切断
   * @returns {Promise<void>} 切断完了時に解決される Promise
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
