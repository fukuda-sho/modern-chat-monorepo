/**
 * エラーFactory関数
 * 型安全なエラー生成と変換
 */

import { ApiClientError } from '@/lib/api-client';
import type {
  AppError,
  NetworkError,
  AuthError,
  ValidationError,
  NotFoundError,
  ServerError,
  WebSocketError,
  UnknownError,
} from './types';
import { isAppError } from './types';

const isDev = process.env.NODE_ENV === 'development';

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * ネットワークエラーを作成
 */
export function createNetworkError(
  message = 'ネットワーク接続に失敗しました',
  originalError?: unknown
): NetworkError {
  return {
    _tag: 'NetworkError',
    message,
    category: 'network',
    severity: 'warning',
    timestamp: Date.now(),
    retryable: true,
    originalError: isDev ? originalError : undefined,
  };
}

/**
 * 認証エラーを作成
 */
export function createAuthError(
  statusCode: 401 | 403,
  message?: string,
  originalError?: unknown
): AuthError {
  const defaults = {
    401: {
      message: 'ログインが必要です',
      severity: 'critical' as const,
    },
    403: {
      message: 'アクセス権限がありません',
      severity: 'warning' as const,
    },
  };

  return {
    _tag: 'AuthError',
    message: message ?? defaults[statusCode].message,
    category: 'auth',
    statusCode,
    severity: defaults[statusCode].severity,
    timestamp: Date.now(),
    retryable: false,
    originalError: isDev ? originalError : undefined,
  };
}

/**
 * バリデーションエラーを作成
 */
export function createValidationError(
  message = '入力内容に問題があります',
  fieldErrors?: Record<string, string[]>,
  originalError?: unknown
): ValidationError {
  return {
    _tag: 'ValidationError',
    message,
    category: 'validation',
    severity: 'info',
    timestamp: Date.now(),
    retryable: false,
    fieldErrors,
    originalError: isDev ? originalError : undefined,
  };
}

/**
 * NotFoundエラーを作成
 */
export function createNotFoundError(
  resource?: string,
  originalError?: unknown
): NotFoundError {
  return {
    _tag: 'NotFoundError',
    message: resource
      ? `${resource}が見つかりませんでした`
      : 'リソースが見つかりませんでした',
    category: 'notFound',
    severity: 'info',
    timestamp: Date.now(),
    retryable: false,
    resource,
    originalError: isDev ? originalError : undefined,
  };
}

/**
 * サーバーエラーを作成
 */
export function createServerError(
  statusCode: number,
  message = 'サーバーエラーが発生しました',
  originalError?: unknown
): ServerError {
  return {
    _tag: 'ServerError',
    message,
    category: 'server',
    statusCode,
    severity: 'warning',
    timestamp: Date.now(),
    retryable: statusCode >= 500 && statusCode < 600,
    originalError: isDev ? originalError : undefined,
  };
}

/**
 * WebSocketエラーを作成
 */
export function createWebSocketError(
  reason: WebSocketError['reason'],
  message?: string,
  originalError?: unknown
): WebSocketError {
  const defaultMessages: Record<WebSocketError['reason'], string> = {
    connection_failed: '接続に失敗しました',
    disconnected: '接続が切断されました',
    timeout: '接続がタイムアウトしました',
    auth_failed: '認証に失敗しました',
  };

  return {
    _tag: 'WebSocketError',
    message: message ?? defaultMessages[reason],
    category: 'websocket',
    reason,
    severity: reason === 'auth_failed' ? 'critical' : 'warning',
    timestamp: Date.now(),
    retryable: reason !== 'auth_failed',
    originalError: isDev ? originalError : undefined,
  };
}

/**
 * 不明なエラーを作成
 */
export function createUnknownError(originalError?: unknown): UnknownError {
  return {
    _tag: 'UnknownError',
    message: '予期しないエラーが発生しました',
    category: 'unknown',
    severity: 'warning',
    timestamp: Date.now(),
    retryable: false,
    originalError: isDev ? originalError : undefined,
  };
}

// =============================================================================
// Error Transformation
// =============================================================================

/**
 * 任意のエラーをAppErrorに変換
 * エラーハンドリングの主要エントリーポイント
 *
 * @example
 * try {
 *   await apiClient.post('/login', data);
 * } catch (error) {
 *   const appError = toAppError(error);
 *   switch (appError._tag) {
 *     case 'AuthError': // 型安全にハンドリング
 *   }
 * }
 */
export function toAppError(error: unknown): AppError {
  // 既にAppErrorの場合はそのまま返す
  if (isAppError(error)) {
    return error;
  }

  // ApiClientError（既存のAPIエラー）を変換
  if (error instanceof ApiClientError) {
    const { statusCode, message } = error;

    switch (statusCode) {
      case 400:
        return createValidationError(message, undefined, error);
      case 401:
        return createAuthError(401, message, error);
      case 403:
        return createAuthError(403, message, error);
      case 404:
        return createNotFoundError(undefined, error);
      default:
        if (statusCode >= 500) {
          return createServerError(statusCode, message, error);
        }
        // その他の4xx系エラー
        return createValidationError(message, undefined, error);
    }
  }

  // fetchのネットワークエラー（TypeError: Failed to fetch）
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createNetworkError(undefined, error);
  }

  // その他のErrorオブジェクト
  if (error instanceof Error) {
    return createUnknownError(error);
  }

  // 上記以外
  return createUnknownError(error);
}

// =============================================================================
// Logging Utility
// =============================================================================

/**
 * 開発環境でエラーをログ出力
 */
export function logError(error: AppError, context?: string): void {
  if (process.env.NODE_ENV !== 'development') return;

  console.group(`[Error]${context ? ` ${context}` : ''} ${error._tag}`);
  console.log('Category:', error.category);
  console.log('Severity:', error.severity);
  console.log('Message:', error.message);
  console.log('Retryable:', error.retryable);
  if (error.originalError) {
    console.log('Original:', error.originalError);
  }
  console.groupEnd();
}
