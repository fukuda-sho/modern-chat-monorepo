/**
 * アプリケーション定数
 *
 * 環境変数は config/env.ts から取得する。
 * このファイルでは環境変数を直接参照しない。
 */

import { env } from '@/config/env';

/**
 * API ベース URL
 */
export const API_BASE_URL = env.apiBaseUrl;

/**
 * WebSocket URL
 */
export const WS_URL = env.wsUrl;

/**
 * 認証トークンのストレージキー
 */
export const AUTH_TOKEN_KEY = 'accessToken';

/**
 * WebSocket 再接続設定
 */
export const RECONNECT_CONFIG = {
  maxAttempts: 10,
  baseDelay: 1000,
  maxDelay: 30000,
  multiplier: 2,
} as const;
