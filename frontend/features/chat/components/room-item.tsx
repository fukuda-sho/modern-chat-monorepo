/**
 * ルーム項目コンポーネント
 */

'use client';

import Link from 'next/link';
import { Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Room } from '@/types';

interface RoomItemProps {
  room: Room;
  isActive: boolean;
}

export function RoomItem({ room, isActive }: RoomItemProps) {
  return (
    <Link
      href={`/chat/${room.id}`}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <Hash className="h-4 w-4 shrink-0" />
      <span className="truncate">{room.name}</span>
    </Link>
  );
}
