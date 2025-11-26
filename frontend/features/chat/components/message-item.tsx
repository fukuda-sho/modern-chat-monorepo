/**
 * 個別メッセージコンポーネント
 */

'use client';

import { memo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

/**
 * メッセージの時刻をフォーマット
 */
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MessageItemComponent({ message, isOwn }: MessageItemProps) {
  return (
    <div
      className={cn(
        'flex items-end gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {!isOwn && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs">
            {message.userId.toString().slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted rounded-bl-sm'
        )}
      >
        <p className="text-sm break-words">{message.content}</p>
        <time
          className={cn(
            'mt-1 block text-xs',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {formatMessageTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
}

export const MessageItem = memo(MessageItemComponent);
