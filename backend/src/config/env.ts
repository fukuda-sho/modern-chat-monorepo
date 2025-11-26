/**
 * @fileoverview 環境変数の設定とバリデーション
 * @description Zod を使用して環境変数の型安全性とバリデーションを提供
 */

import { z } from 'zod';

/**
 * 環境変数のスキーマ定義
 * @description すべての環境変数をここで定義し、バリデーションを行う
 */
const envSchema = z.object({
  // ============================================
  // アプリ設定値（非機密 Config）
  // ============================================

  /**
   * アプリケーション環境
   * @default 'development'
   */
  APP_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),

  /**
   * ログレベル
   * @default 'info'
   */
  APP_LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),

  /**
   * バックエンドサーバーのポート番号
   * @default 3000
   */
  BACKEND_PORT: z
    .string()
    .default('3000')
    .transform((v) => Number(v)),

  // ============================================
  // データベース設定（機密情報）
  // ============================================

  /**
   * MySQL データベース接続 URL
   * @example 'mysql://user:password@localhost:3306/database'
   */
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // ============================================
  // JWT 認証設定（機密情報）
  // ============================================

  /**
   * JWT 署名用シークレットキー
   * @description 本番環境では必ず強力なランダム文字列を使用すること
   */
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),

  /**
   * JWT トークンの有効期限
   * @default '1h'
   * @example '1h', '7d', '30m'
   */
  JWT_EXPIRES_IN: z.string().default('1h'),
});

/**
 * 環境変数の型定義
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 環境変数をパースしてバリデーション済みのオブジェクトを返す
 * @returns {Env} バリデーション済み環境変数
 * @throws {ZodError} バリデーションエラー時
 */
function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:');
    // eslint-disable-next-line no-console
    console.error(result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

/**
 * バリデーション済み環境変数
 * @description アプリケーション全体でこのオブジェクトを使用して環境変数にアクセスする
 * @example
 * ```typescript
 * import { env } from './config/env';
 *
 * const port = env.BACKEND_PORT;
 * const dbUrl = env.DATABASE_URL;
 * ```
 */
export const env = parseEnv();

/**
 * 開発環境かどうかを判定
 * @returns {boolean} 開発環境の場合 true
 */
export const isDevelopment = (): boolean => env.APP_ENV === 'development';

/**
 * 本番環境かどうかを判定
 * @returns {boolean} 本番環境の場合 true
 */
export const isProduction = (): boolean => env.APP_ENV === 'production';

/**
 * ステージング環境かどうかを判定
 * @returns {boolean} ステージング環境の場合 true
 */
export const isStaging = (): boolean => env.APP_ENV === 'staging';
