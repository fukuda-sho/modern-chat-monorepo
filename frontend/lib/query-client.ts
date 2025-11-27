/**
 * TanStack Query クライアント設定
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { toAppError, logError } from '@/lib/errors';

/**
 * カテゴリに応じたリトライ判定
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  const appError = toAppError(error);

  // 認証・バリデーション・NotFoundエラーはリトライしない
  if (appError._tag === 'AuthError') return false;
  if (appError._tag === 'ValidationError') return false;
  if (appError._tag === 'NotFoundError') return false;

  // リトライ可能なエラーは3回まで
  return appError.retryable && failureCount < 3;
}

/**
 * Mutation用リトライ判定（ネットワークエラーのみ1回）
 */
function shouldRetryMutation(failureCount: number, error: unknown): boolean {
  const appError = toAppError(error);
  return appError._tag === 'NetworkError' && failureCount < 1;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5分
        gcTime: 1000 * 60 * 30, // 30分
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: shouldRetryMutation,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        const appError = toAppError(error);
        logError(appError, `QueryCache [${String(query.queryKey)}]`);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const appError = toAppError(error);
        logError(appError, `MutationCache [${String(mutation.options.mutationKey ?? 'unknown')}]`);
      },
    }),
  });
}

// シングルトンインスタンス（クライアントサイド用）
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // サーバーサイドでは常に新しいインスタンスを作成
    return createQueryClient();
  }

  // ブラウザではシングルトンを使用
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
}
