/**
 * @fileoverview Prisma サービス
 * @description PrismaClient をラップし、DB 接続のライフサイクルを管理する
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

/**
 * データベース接続設定の型定義
 */
interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/**
 * DATABASE_URL から接続設定をパースする
 * @param {string} url - MySQL接続URL
 * @returns {DbConfig} パースされた接続設定
 */
function parseDbUrl(url: string): DbConfig {
  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = url.match(regex);

  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
  };
}

/**
 * Prisma サービスクラス
 * @description PrismaClient を継承し、NestJS のライフサイクルフックに対応
 * @extends PrismaClient
 * @implements {OnModuleInit}
 * @implements {OnModuleDestroy}
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  /**
   * PrismaService のコンストラクタ
   * @description MariaDB アダプターを使用して PrismaClient を初期化
   */
  constructor() {
    const dbUrl =
      process.env.DATABASE_URL || 'mysql://chat_user:chat_password@localhost:3306/chat_app';
    const config = parseDbUrl(dbUrl);

    const adapter = new PrismaMariaDb({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: 10,
    });

    super({ adapter });
  }

  /**
   * モジュール初期化時にデータベースへ接続
   * @returns {Promise<void>} 接続完了時に解決される Promise
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * モジュール破棄時にデータベース接続を切断
   * @returns {Promise<void>} 切断完了時に解決される Promise
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
