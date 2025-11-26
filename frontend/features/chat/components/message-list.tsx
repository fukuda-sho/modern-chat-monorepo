/**
 * メッセージ一覧コンポーネント
 */

'use client';

import { useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './message-item';
import { useScrollToBottom } from '../hooks/use-scroll-to-bottom';
import { useCurrentUser } from '@/features/auth';
import type { Message } from '@/types';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
  className?: string;
}

export function MessageList({ messages, className }: MessageListProps) {
  const { data: currentUser } = useCurrentUser();
  const scrollRef = useRef<HTMLDivElement>(null);

  useScrollToBottom(scrollRef, messages);

  return (
    <ScrollArea className={cn('px-4', className)}>
      <div ref={scrollRef} className="space-y-4 py-4">
        {messages.length === 0 ? (
          <div className="text-muted-foreground flex h-full min-h-[200px] items-center justify-center">
            メッセージはまだありません
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.userId === currentUser?.id}
            />
          ))
        )}
      </div>
    </ScrollArea>
  );
}
