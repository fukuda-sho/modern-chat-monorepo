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
        'bg-muted/40 flex h-full w-64 flex-col border-r',
        className
      )}
    >
      <RoomList />
    </aside>
  );
}
