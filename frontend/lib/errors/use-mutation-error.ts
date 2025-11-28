'use client';

/**
 * TanStack Query Mutation エラーハンドリングフック
 */

import { useCallback, useMemo } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { AppError } from './types';
import { toAppError } from './factory';
import { useErrorNotification } from './use-error-notification';

interface UseMutationErrorOptions {
  /**
   * エラー発生時に自動で通知を表示
   * @default false
   */
  autoNotify?: boolean;
  /**
   * カスタムエラー変換関数
   */
  transformError?: (error: unknown) => AppError;
}

interface UseMutationErrorReturn {
  /** 変換済みAppError（エラーがない場合はnull） */
  error: AppError | null;
  /** 再試行可能かどうか */
  isRetryable: boolean;
  /** ユーザー向けエラーメッセージ */
  errorMessage: string | null;
  /** エラーをリセット */
  resetError: () => void;
  /** 手動でエラーを通知 */
  notifyError: () => void;
}

/**
 * Mutation エラーハンドリングフック
 *
 * @example
 * const mutation = useLogin();
 * const { error, errorMessage, isRetryable, resetError } = useMutationError(mutation);
 *
 * // エラー表示
 * {error && <p className="text-destructive">{errorMessage}</p>}
 *
 * // 再試行ボタン
 * {isRetryable && <Button onClick={() => mutation.mutate(data)}>再試行</Button>}
 *
 * @example
 * // 自動通知付き
 * const { error } = useMutationError(mutation, { autoNotify: true });
 */
export function useMutationError<TData, TError, TVariables, TContext>(
  mutation: UseMutationResult<TData, TError, TVariables, TContext>,
  options: UseMutationErrorOptions = {}
): UseMutationErrorReturn {
  const { autoNotify = false, transformError } = options;
  const { notifyError: notify } = useErrorNotification();

  // エラーをAppErrorに変換
  const error = useMemo<AppError | null>(() => {
    if (!mutation.error) return null;
    return transformError
      ? transformError(mutation.error)
      : toAppError(mutation.error);
  }, [mutation.error, transformError]);

  // 自動通知
  useMemo(() => {
    if (autoNotify && error) {
      notify(error);
    }
  }, [autoNotify, error, notify]);

  const isRetryable = useMemo(() => error?.retryable ?? false, [error]);
  const errorMessage = useMemo(() => error?.message ?? null, [error]);

  const resetError = useCallback(() => {
    mutation.reset();
  }, [mutation]);

  const notifyError = useCallback(() => {
    if (error) {
      notify(error);
    }
  }, [error, notify]);

  return {
    error,
    isRetryable,
    errorMessage,
    resetError,
    notifyError,
  };
}
