/**
 * エラーハンドリングモジュール
 * @module lib/errors
 */

// Types
export type {
  ErrorSeverity,
  ErrorCategory,
  AppError,
  NetworkError,
  AuthError,
  ValidationError,
  NotFoundError,
  ServerError,
  WebSocketError,
  UnknownError,
} from './types';

// Type Guards
export { isAppError, isRetryableError, isErrorTag } from './types';

// Factory Functions
export {
  createNetworkError,
  createAuthError,
  createValidationError,
  createNotFoundError,
  createServerError,
  createWebSocketError,
  createUnknownError,
  toAppError,
  logError,
} from './factory';

// Store
export { useErrorStore } from './error-store';

// Hooks
export { useErrorNotification } from './use-error-notification';
export { useMutationError } from './use-mutation-error';
export { useQueryError } from './use-query-error';
