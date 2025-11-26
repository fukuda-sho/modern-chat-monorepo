/**
 * ヘッダーコンポーネント
 */

'use client';

import { MessageCircle, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCurrentUser, useLogout } from '@/features/auth';
import { ConnectionStatus } from '@/features/chat';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: user } = useCurrentUser();
  const { logout } = useLogout();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
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
          <MessageCircle className="h-6 w-6 text-primary" />
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
