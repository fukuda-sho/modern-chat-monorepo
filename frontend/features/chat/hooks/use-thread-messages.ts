/**
 * @fileoverview スレッドメッセージ取得フック
 */

'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { fetchThreadMessages } from '../api/messages-api';
import type { Message, ThreadMessagesResponse } from '@/types';

/** Query Key */
export const threadMessagesKeys = {
  all: ['threadMessages'] as const,
  thread: (parentId: number) => [...threadMessagesKeys.all, parentId] as const,
};

const THREAD_MESSAGES_PER_PAGE = 30;

/**
 * スレッドメッセージ取得
 */
export function useThreadMessages(parentMessageId: number | null, enabled = true) {
  return useInfiniteQuery({
    queryKey: threadMessagesKeys.thread(parentMessageId ?? 0),
    queryFn: async ({ pageParam }) => {
      if (!parentMessageId) throw new Error('Parent message ID is required');
      return fetchThreadMessages(parentMessageId, {
        cursor: pageParam,
        direction: 'older',
        limit: THREAD_MESSAGES_PER_PAGE,
      });
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor ?? undefined : undefined,
    enabled: enabled && !!parentMessageId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * スレッドキャッシュ操作ヘルパー
 */
export function useThreadCacheUpdater() {
  const queryClient = useQueryClient();

  const updateThread = useCallback(
    (
      parentId: number,
      updater: (data: { pages: ThreadMessagesResponse[]; pageParams: (number | undefined)[] }) =>
        | { pages: ThreadMessagesResponse[]; pageParams: (number | undefined)[] }
        | undefined,
    ) => {
      queryClient.setQueryData<{ pages: ThreadMessagesResponse[]; pageParams: (number | undefined)[] }>(
        threadMessagesKeys.thread(parentId),
        (old) => (old ? updater(old) : old),
      );
    },
    [queryClient],
  );

  const addReply = useCallback(
    (parentId: number, reply: Message) => {
      updateThread(parentId, (old) => {
        if (!old) return old;
        const newPages = [...old.pages];
        if (newPages.length > 0) {
          const firstPage = { ...newPages[0] };
          const exists = firstPage.replies.some(
            (r) => r.id === reply.id || (r.localId && reply.localId && r.localId === reply.localId),
          );
          if (exists) return old;
          firstPage.replies = [...firstPage.replies, reply];
          newPages[0] = firstPage;
        }
        return { ...old, pages: newPages };
      });
    },
    [updateThread],
  );

  const updateReply = useCallback(
    (parentId: number, replyId: number, updates: Partial<Message>) => {
      updateThread(parentId, (old) => {
        if (!old) return old;
        const newPages = old.pages.map((page) => ({
          ...page,
          replies: page.replies.map((reply) =>
            reply.id === replyId ? { ...reply, ...updates } : reply,
          ),
        }));
        return { ...old, pages: newPages };
      });
    },
    [updateThread],
  );

  const updateSummary = useCallback(
    (
      parentId: number,
      summary: {
        threadReplyCount: number;
        threadLastRepliedAt: string | null;
        threadLastRepliedBy: number | null;
        threadLastRepliedByUsername?: string;
      },
    ) => {
      updateThread(parentId, (old) => {
        if (!old) return old;
        const newPages = old.pages.map((page, index) =>
          index === 0
            ? {
                ...page,
                parent: {
                  ...page.parent,
                  threadReplyCount: summary.threadReplyCount,
                  threadLastRepliedAt: summary.threadLastRepliedAt,
                  threadLastRepliedBy: summary.threadLastRepliedBy,
                  threadLastRepliedByUser:
                    summary.threadLastRepliedByUsername && summary.threadLastRepliedBy
                      ? {
                          id: summary.threadLastRepliedBy,
                          username: summary.threadLastRepliedByUsername,
                          email: '',
                        }
                      : page.parent.threadLastRepliedByUser,
                },
              }
            : page,
        );
        return { ...old, pages: newPages };
      });
    },
    [updateThread],
  );

  return { addReply, updateReply, updateSummary };
}
