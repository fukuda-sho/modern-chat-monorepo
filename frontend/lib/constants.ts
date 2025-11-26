/**
 * アプリケーション定数
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

export const AUTH_TOKEN_KEY = 'accessToken';

export const RECONNECT_CONFIG = {
  maxAttempts: 10,
  baseDelay: 1000,
  maxDelay: 30000,
  multiplier: 2,
} as const;
