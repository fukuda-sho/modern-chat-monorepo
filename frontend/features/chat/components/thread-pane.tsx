/**
 * @fileoverview スレッド右ペイン
 */

'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, X, ArrowUpCircle } from 'lucide-react';
import { MessageCell } from './message-cell';
import { ThreadReplyList } from './thread-reply-list';
import { ThreadReplyInput } from './thread-reply-input';
import { useThreadMessages, useThreadCacheUpdater } from '../hooks/use-thread-messages';
import { useChatSocket } from '../hooks/use-chat-socket';
import { useCurrentUser } from '@/features/auth';
import type { Message } from '@/types';

type ThreadPaneProps = {
  parentMessageId: number | null;
  onClose: () => void;
};

export function ThreadPane({ parentMessageId, onClose }: ThreadPaneProps): React.ReactElement | null {
  const { data: currentUser } = useCurrentUser();
  const { createThreadReply, isConnected } = useChatSocket();
  const { addReply } = useThreadCacheUpdater();

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useThreadMessages(parentMessageId, Boolean(parentMessageId));

  const parent = data?.pages?.[0]?.parent;
  const replies: Message[] = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages
      .flatMap((page) => page.replies)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [data?.pages]);

  const errorMessage = error instanceof Error ? error.message : '不明なエラー';

  const handleSendReply = (content: string) => {
    if (!parentMessageId) return;
    const localId = crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`;
    const optimistic: Message = {
      id: -Math.abs(Date.now()),
      roomId: parent?.roomId ?? 0,
      parentMessageId,
      userId: currentUser?.id ?? 0,
      username: currentUser?.username,
      content,
      createdAt: new Date().toISOString(),
      localId,
      isPending: true,
      isEdited: false,
      isDeleted: false,
      threadReplyCount: 0,
      threadLastRepliedAt: null,
      threadLastRepliedBy: null,
      reactions: [],
    };
    addReply(parentMessageId, optimistic);
    createThreadReply(parentMessageId, content, localId);
  };

  if (!parentMessageId) return null;

  return (
    <aside className="w-[380px] border-l bg-background flex flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">スレッド</p>
          {parent && <p className="text-muted-foreground line-clamp-2 text-xs">{parent.content}</p>}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="スレッドを閉じる">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {isLoading && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            読み込み中...
          </div>
        )}

        {isError && (
          <div className="text-destructive text-sm">
            スレッドの読み込みに失敗しました: {errorMessage}
          </div>
        )}

        {parent && (
          <div className="rounded-md border bg-muted/40 p-2">
            <MessageCell
              message={parent}
              currentUserId={currentUser?.id ?? 0}
              showThreadActions={false}
            />
          </div>
        )}

        <ThreadReplyList replies={replies} currentUserId={currentUser?.id ?? 0} />

        {hasNextPage && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            <ArrowUpCircle className="h-4 w-4" />
            {isFetchingNextPage ? '読み込み中...' : '過去の返信を読み込む'}
          </Button>
        )}
      </div>

      <ThreadReplyInput
        parentMessageId={parentMessageId}
        onSend={handleSendReply}
        disabled={!isConnected}
      />
    </aside>
  );
}
