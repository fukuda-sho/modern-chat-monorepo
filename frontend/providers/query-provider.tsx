/**
 * @fileoverview TanStack Query プロバイダー
 * @description データフェッチ・キャッシュ管理のための QueryClient を提供する
 * 開発環境では ReactQueryDevtools も表示
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/query-client';

/** Query プロバイダーの Props 型 */
type QueryProviderProps = {
  /** プロバイダーでラップする子コンテンツ */
  children: React.ReactNode;
};

/**
 * TanStack Query プロバイダーコンポーネント
 * クライアントコンポーネントとして QueryClient をコンテキスト経由で提供
 * getQueryClient() でシングルトンインスタンスを取得し、
 * Socket.IO など外部からのキャッシュ更新と同期
 * 開発環境では ReactQueryDevtools を表示（デフォルトは閉じた状態）
 *
 * @param props - プロバイダー用 props
 * @returns Query プロバイダーの JSX 要素
 */
export function QueryProvider({ children }: QueryProviderProps): React.JSX.Element {
  // シングルトンインスタンスを使用（Socket.IO からのキャッシュ更新と同期するため）
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
