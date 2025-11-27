/**
 * @fileoverview 統合プロバイダー
 * @description アプリケーション全体で必要なプロバイダーを統合して提供する
 * QueryProvider, ThemeProvider, Toaster を一括でラップ
 */

'use client';

import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { Toaster } from '@/components/ui/sonner';

/** 統合プロバイダーの Props 型 */
type ProvidersProps = {
  /** プロバイダーでラップする子コンテンツ */
  children: React.ReactNode;
};

/**
 * アプリケーション統合プロバイダーコンポーネント
 * クライアントコンポーネントとして、以下のプロバイダーを統合:
 * - QueryProvider: TanStack Query のデータフェッチ機能
 * - ThemeProvider: ダーク/ライトテーマ切り替え
 * - Toaster: トースト通知
 *
 * @param props - プロバイダー用 props
 * @returns 統合プロバイダーの JSX 要素
 */
export function Providers({ children }: ProvidersProps): React.JSX.Element {
  return (
    <QueryProvider>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryProvider>
  );
}
