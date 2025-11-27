/**
 * @fileoverview Channel Item Component
 * @description サイドバーに表示される個別チャンネルアイテム
 */

'use client';

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hash, Lock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ChatRoom } from '@/types/chat';
import { useToggleStar } from '../hooks/use-channels';

/** ChannelItem のプロップス */
interface ChannelItemProps {
  /** チャンネル情報 */
  channel: ChatRoom;
  /** コンパクト表示モード */
  compact?: boolean;
}

/**
 * チャンネルタイプに応じたアイコンを返す
 */
function ChannelIcon({ type }: { type: ChatRoom['type'] }) {
  if (type === 'PRIVATE') {
    return <Lock className="h-4 w-4 shrink-0" />;
  }
  return <Hash className="h-4 w-4 shrink-0" />;
}

/**
 * ChannelItem コンポーネント
 * @description 個別チャンネルをサイドバーに表示するためのコンポーネント
 */
export const ChannelItem = memo(function ChannelItem({
  channel,
  compact = false,
}: ChannelItemProps) {
  const pathname = usePathname();
  const isActive = pathname === `/chat/${channel.id}`;
  const { mutate: toggleStar, isPending: isToggling } = useToggleStar();

  const handleStarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleStar(channel.id);
  };

  return (
    <Link
      href={`/chat/${channel.id}`}
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground font-medium',
      )}
    >
      <ChannelIcon type={channel.type} />
      <span className="truncate flex-1">{channel.name}</span>

      {!compact && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 shrink-0',
            channel.membership?.isStarred
              ? 'text-yellow-500'
              : 'opacity-0 group-hover:opacity-100',
          )}
          onClick={handleStarClick}
          disabled={isToggling}
          aria-label={channel.membership?.isStarred ? 'スターを外す' : 'スターを付ける'}
        >
          <Star
            className={cn(
              'h-3.5 w-3.5',
              channel.membership?.isStarred && 'fill-current',
            )}
          />
        </Button>
      )}
    </Link>
  );
});
