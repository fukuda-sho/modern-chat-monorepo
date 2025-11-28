/**
 * エラー型定義
 * Discriminated Unions による型安全なエラーハンドリング
 */

// =============================================================================
// Severity & Category
// =============================================================================

/**
 * エラーの重大度
 * - critical: Modal表示（ユーザーアクション必須）
 * - warning: Toast表示（5秒で自動非表示）
 * - info: Toast表示（3秒で自動非表示）
 */
export type ErrorSeverity = 'critical' | 'warning' | 'info';

/**
 * エラーカテゴリ
 */
export type ErrorCategory =
  | 'network' // 接続失敗、タイムアウト
  | 'auth' // 401, 403, トークン期限切れ
  | 'validation' // 400, Zodエラー
  | 'notFound' // 404
  | 'server' // 500+
  | 'websocket' // Socket.IOエラー
  | 'unknown'; // フォールバック

// =============================================================================
// Base Error Interface
// =============================================================================

/**
 * 全エラー型の基底インターフェース
 */
interface BaseAppError {
  /** 判別用タグ（Discriminated Union） */
  readonly _tag: string;
  /** ユーザー向けメッセージ（日本語） */
  readonly message: string;
  /** エラーカテゴリ */
  readonly category: ErrorCategory;
  /** 重大度 */
  readonly severity: ErrorSeverity;
  /** 発生時刻（Unix timestamp） */
  readonly timestamp: number;
  /** 再試行可能かどうか */
  readonly retryable: boolean;
  /** 元のエラー（開発環境のみ） */
  readonly originalError?: unknown;
}

// =============================================================================
// Specific Error Types
// =============================================================================

/**
 * ネットワークエラー
 * 接続失敗、タイムアウトなど
 */
export interface NetworkError extends BaseAppError {
  readonly _tag: 'NetworkError';
  readonly category: 'network';
}

/**
 * 認証エラー
 * 401 Unauthorized, 403 Forbidden
 */
export interface AuthError extends BaseAppError {
  readonly _tag: 'AuthError';
  readonly category: 'auth';
  readonly statusCode: 401 | 403;
}

/**
 * バリデーションエラー
 * 400 Bad Request, フォーム入力エラー
 */
export interface ValidationError extends BaseAppError {
  readonly _tag: 'ValidationError';
  readonly category: 'validation';
  /** フィールドごとのエラーメッセージ */
  readonly fieldErrors?: Record<string, string[]>;
}

/**
 * Not Foundエラー
 * 404
 */
export interface NotFoundError extends BaseAppError {
  readonly _tag: 'NotFoundError';
  readonly category: 'notFound';
  /** 見つからなかったリソース名 */
  readonly resource?: string;
}

/**
 * サーバーエラー
 * 500系エラー
 */
export interface ServerError extends BaseAppError {
  readonly _tag: 'ServerError';
  readonly category: 'server';
  readonly statusCode: number;
}

/**
 * WebSocketエラー
 * Socket.IO関連エラー
 */
export interface WebSocketError extends BaseAppError {
  readonly _tag: 'WebSocketError';
  readonly category: 'websocket';
  readonly reason:
    | 'connection_failed'
    | 'disconnected'
    | 'timeout'
    | 'auth_failed';
}

/**
 * 不明なエラー
 * フォールバック用
 */
export interface UnknownError extends BaseAppError {
  readonly _tag: 'UnknownError';
  readonly category: 'unknown';
}

// =============================================================================
// Union Type
// =============================================================================

/**
 * アプリケーションエラーの統合型
 * switch文で網羅的にハンドリング可能
 */
export type AppError =
  | NetworkError
  | AuthError
  | ValidationError
  | NotFoundError
  | ServerError
  | WebSocketError
  | UnknownError;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * AppError型かどうかを判定
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    '_tag' in error &&
    typeof (error as AppError)._tag === 'string' &&
    'category' in error &&
    'severity' in error
  );
}

/**
 * 再試行可能なエラーかどうかを判定
 */
export function isRetryableError(error: AppError): boolean {
  return error.retryable;
}

/**
 * 特定のエラータグかどうかを判定
 */
export function isErrorTag<T extends AppError['_tag']>(
  error: AppError,
  tag: T
): error is Extract<AppError, { _tag: T }> {
  return error._tag === tag;
}
