/**
 * メインレイアウトコンポーネント
 */

'use client';

import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
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
