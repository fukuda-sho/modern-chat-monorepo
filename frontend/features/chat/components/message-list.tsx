/**
 * @fileoverview メッセージ一覧コンポーネント
 * @description チャットメッセージをスクロール可能なリストで表示する
 * 新着メッセージ時に自動スクロール、自分/他者のメッセージを区別
 */

'use client';

import { useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './message-item';
import { useScrollToBottom } from '../hooks/use-scroll-to-bottom';
import { useCurrentUser } from '@/features/auth';
import type { Message } from '@/types';
import { cn } from '@/lib/utils';

/** メッセージ一覧の Props 型 */
type MessageListProps = {
  /** 表示するメッセージの配列 */
  messages: Message[];
  /** 追加の CSS クラス名 */
  className?: string;
};

/**
 * メッセージ一覧コンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - メッセージをスクロール可能なエリアで表示
 * - 新着メッセージ時に自動で最下部にスクロール
 * - 現在のユーザーを取得し、自分のメッセージを識別
 * - メッセージがない場合はプレースホルダーを表示
 *
 * @param props - メッセージ一覧用 props
 * @returns メッセージ一覧の JSX 要素
 */
export function MessageList({ messages, className }: MessageListProps): React.JSX.Element {
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
