/**
 * 環境変数の集中管理モジュール
 *
 * すべての環境変数アクセスはこのモジュールを経由する。
 * 直接 process.env.NEXT_PUBLIC_* を参照しない。
 */

import { z } from 'zod';

/**
 * 環境変数のスキーマ定義
 */
const envSchema = z.object({
  /** アプリケーション環境 */
  appEnv: z.enum(['development', 'staging', 'production']).default('development'),

  /** バックエンド API のベース URL */
  apiBaseUrl: z.string().url().default('http://localhost:3000'),

  /** WebSocket 接続先 URL */
  wsUrl: z.string().url().default('http://localhost:3000'),

  /** アプリケーションバージョン */
  appVersion: z.string().default('dev'),
});

/**
 * 環境変数の型
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 環境変数を取得・バリデーション
 */
function getEnv(): Env {
  const rawEnv = {
    appEnv: process.env.APP_ENV,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    wsUrl: process.env.NEXT_PUBLIC_WS_URL,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    console.error('Environment variable validation failed:', result.error.format());
    // 開発環境ではデフォルト値で続行
    return envSchema.parse({});
  }

  return result.data;
}

/**
 * バリデーション済み環境変数
 */
export const env = getEnv();

/**
 * 環境判定ヘルパー
 */
export const isDevelopment = env.appEnv === 'development';
export const isStaging = env.appEnv === 'staging';
export const isProduction = env.appEnv === 'production';
