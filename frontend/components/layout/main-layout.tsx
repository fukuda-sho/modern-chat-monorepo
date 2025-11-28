/**
 * @fileoverview メインレイアウトコンポーネント
 * @description 認証済みユーザー向けのメインレイアウト
 * ヘッダー、サイドバー、メインコンテンツエリアを統括
 * モバイル対応のレスポンシブサイドバーを提供
 */

'use client';

import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

/** メインレイアウトの Props 型 */
type MainLayoutProps = {
  /** メインコンテンツエリアに表示する子コンテンツ */
  children: React.ReactNode;
};

/**
 * メインレイアウトコンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - 上部にヘッダー、左にサイドバー、右にメインコンテンツの3カラム構成
 * - モバイル時はサイドバーをスライドイン/アウト（オーバーレイ付き）
 * - デスクトップ時はサイドバーを常時表示
 *
 * @param props - メインレイアウト用 props
 * @returns メインレイアウトの JSX 要素
 */
export function MainLayout({ children }: MainLayoutProps): React.JSX.Element {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* モバイルオーバーレイ */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* サイドバー */}
        <Sidebar
          className={cn(
            'fixed inset-y-0 top-14 left-0 z-50 transition-transform md:static md:translate-x-0',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        />

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
