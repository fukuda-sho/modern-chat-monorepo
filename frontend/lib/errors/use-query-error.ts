'use client';

/**
 * TanStack Query Query エラーハンドリングフック
 */

import { useEffect, useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { AppError, ErrorCategory } from './types';
import { toAppError } from './factory';
import { useErrorNotification } from './use-error-notification';

interface UseQueryErrorOptions {
  /**
   * エラー発生時に自動で通知を表示
   * @default false
   */
  autoNotify?: boolean;
  /**
   * 通知を行うエラーカテゴリ（指定しない場合は全て）
   */
  notifyOn?: ErrorCategory[];
  /**
   * カスタムエラー変換関数
   */
  transformError?: (error: unknown) => AppError;
}

interface UseQueryErrorReturn {
  /** 変換済みAppError（エラーがない場合はnull） */
  error: AppError | null;
  /** ユーザー向けエラーメッセージ */
  errorMessage: string | null;
  /** 再試行可能かどうか */
  canRetry: boolean;
}

/**
 * Query エラーハンドリングフック
 *
 * @example
 * const query = useCurrentUser();
 * const { error, errorMessage } = useQueryError(query);
 *
 * if (error) {
 *   return <ErrorDisplay message={errorMessage} />;
 * }
 *
 * @example
 * // 特定カテゴリのみ通知
 * const { error } = useQueryError(query, {
 *   autoNotify: true,
 *   notifyOn: ['network', 'server'],
 * });
 */
export function useQueryError<TData, TError>(
  query: UseQueryResult<TData, TError>,
  options: UseQueryErrorOptions = {}
): UseQueryErrorReturn {
  const { autoNotify = false, notifyOn, transformError } = options;
  const { notifyError } = useErrorNotification();

  // エラーをAppErrorに変換
  const error = useMemo<AppError | null>(() => {
    if (!query.error) return null;
    return transformError
      ? transformError(query.error)
      : toAppError(query.error);
  }, [query.error, transformError]);

  const errorMessage = useMemo(() => error?.message ?? null, [error]);
  const canRetry = useMemo(() => error?.retryable ?? false, [error]);

  // 自動通知（条件付き）
  useEffect(() => {
    if (!autoNotify || !error) return;

    // notifyOnが指定されている場合、そのカテゴリのみ通知
    const shouldNotify = !notifyOn || notifyOn.includes(error.category);
    if (shouldNotify) {
      notifyError(error);
    }
  }, [autoNotify, error, notifyOn, notifyError]);

  return {
    error,
    errorMessage,
    canRetry,
  };
}
