/**
 * @fileoverview ヘッダーコンポーネント
 * @description アプリケーション上部に表示される共通ヘッダー
 * ロゴ、接続状態、ユーザー情報、ログアウトボタンを配置
 */

'use client';

import { MessageCircle, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCurrentUser, useLogout } from '@/features/auth';
import { ConnectionStatus } from '@/features/chat';

/** ヘッダーの Props 型 */
type HeaderProps = {
  /** モバイルメニューボタンのクリックハンドラ */
  onMenuClick?: () => void;
};

/**
 * ヘッダーコンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - アプリロゴとタイトル表示
 * - モバイル時はハンバーガーメニューボタン表示
 * - WebSocket 接続状態バッジ
 * - ユーザーアバターとユーザー名表示
 * - ログアウトボタン
 *
 * @param props - ヘッダー用 props
 * @returns ヘッダーの JSX 要素
 */
export function Header({ onMenuClick }: HeaderProps): React.JSX.Element {
  const { data: user } = useCurrentUser();
  const { logout } = useLogout();

  return (
    <header className="bg-background flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">メニュー</span>
        </Button>

        <div className="flex items-center gap-2">
          <MessageCircle className="text-primary h-6 w-6" />
          <span className="text-lg font-bold">Chat App</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ConnectionStatus />

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {user?.username?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:inline">
            {user?.username}
          </span>
        </div>

        <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">ログアウト</span>
        </Button>
      </div>
    </header>
  );
}
