/**
 * サイドバーコンポーネント
 */

'use client';

import { RoomList } from '@/features/chat';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r bg-muted/40',
        className
      )}
    >
      <RoomList />
    </aside>
  );
}
