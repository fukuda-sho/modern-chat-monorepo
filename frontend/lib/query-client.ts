/**
 * TanStack Query クライアント設定
 */

import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5分
        gcTime: 1000 * 60 * 30, // 30分
        retry: 3,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
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
