/**
 * @fileoverview ルームメッセージ取得フック
 * @description TanStack Query の useInfiniteQuery を使用したメッセージ履歴取得
 */

'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { fetchRoomMessages } from '../api/messages-api';
import type { Message, MessageHistoryResponse } from '@/types';

/** Query Key ファクトリ */
export const roomMessagesKeys = {
  all: ['roomMessages'] as const,
  room: (roomId: number) => [...roomMessagesKeys.all, roomId] as const,
};

const MESSAGES_PER_PAGE = 50;

/**
 * ルームのメッセージ履歴を取得する Infinite Query フック
 * @param roomId ルームID
 * @param enabled クエリを有効化するかどうか
 */
export function useRoomMessages(roomId: number | null, enabled = true) {
  return useInfiniteQuery({
    queryKey: roomMessagesKeys.room(roomId ?? 0),
    queryFn: async ({ pageParam }) => {
      if (!roomId) throw new Error('Room ID is required');
      return fetchRoomMessages(roomId, {
        cursor: pageParam,
        direction: 'older',
        limit: MESSAGES_PER_PAGE,
      });
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor ?? undefined : undefined,
    enabled: enabled && roomId !== null && roomId > 0,
    staleTime: 1000 * 60 * 5, // 5分
    gcTime: 1000 * 60 * 30, // 30分
  });
}

/**
 * メッセージキャッシュを操作するユーティリティフック
 */
export function useMessageCacheUpdater() {
  const queryClient = useQueryClient();

  /**
   * 新着メッセージをキャッシュに追加
   */
  const addMessage = useCallback(
    (roomId: number, message: Message) => {
      queryClient.setQueryData<{
        pages: MessageHistoryResponse[];
        pageParams: (number | undefined)[];
      }>(roomMessagesKeys.room(roomId), (oldData) => {
        if (!oldData) return oldData;

        // 最初のページ（最新のメッセージを含む）に追加
        const newPages = [...oldData.pages];
        if (newPages.length > 0) {
          // 重複チェック
          const allMessages = newPages.flatMap((p) => p.data);
          if (allMessages.some((m) => m.id === message.id)) {
            return oldData; // すでに存在する場合は追加しない
          }

          newPages[0] = {
            ...newPages[0],
            data: [...newPages[0].data, message],
          };
        }

        return {
          ...oldData,
          pages: newPages,
        };
      });
    },
    [queryClient],
  );

  /**
   * オプティミスティック更新のメッセージを確定
   */
  const confirmMessage = useCallback(
    (roomId: number, localId: string, serverMessage: Message) => {
      queryClient.setQueryData<{
        pages: MessageHistoryResponse[];
        pageParams: (number | undefined)[];
      }>(roomMessagesKeys.room(roomId), (oldData) => {
        if (!oldData) return oldData;

        const newPages = oldData.pages.map((page) => ({
          ...page,
          data: page.data.map((msg) =>
            msg.localId === localId
              ? { ...serverMessage, isPending: false }
              : msg,
          ),
        }));

        return {
          ...oldData,
          pages: newPages,
        };
      });
    },
    [queryClient],
  );

  /**
   * オプティミスティック更新の失敗処理
   */
  const failMessage = useCallback(
    (roomId: number, localId: string) => {
      queryClient.setQueryData<{
        pages: MessageHistoryResponse[];
        pageParams: (number | undefined)[];
      }>(roomMessagesKeys.room(roomId), (oldData) => {
        if (!oldData) return oldData;

        const newPages = oldData.pages.map((page) => ({
          ...page,
          data: page.data.filter((msg) => msg.localId !== localId),
        }));

        return {
          ...oldData,
          pages: newPages,
        };
      });
    },
    [queryClient],
  );

  /**
   * オプティミスティック更新用のメッセージを追加
   */
  const addOptimisticMessage = useCallback(
    (roomId: number, message: Message) => {
      queryClient.setQueryData<{
        pages: MessageHistoryResponse[];
        pageParams: (number | undefined)[];
      }>(roomMessagesKeys.room(roomId), (oldData) => {
        if (!oldData) {
          // キャッシュがない場合は新しいページを作成
          return {
            pages: [
              {
                data: [{ ...message, isPending: true }],
                pagination: { hasMore: false, nextCursor: null, prevCursor: null },
              },
            ],
            pageParams: [undefined],
          };
        }

        const newPages = [...oldData.pages];
        if (newPages.length > 0) {
          newPages[0] = {
            ...newPages[0],
            data: [...newPages[0].data, { ...message, isPending: true }],
          };
        }

        return {
          ...oldData,
          pages: newPages,
        };
      });
    },
    [queryClient],
  );

  /**
   * キャッシュをクリア（ルーム退出時など）
   */
  const clearCache = useCallback(
    (roomId: number) => {
      queryClient.removeQueries({
        queryKey: roomMessagesKeys.room(roomId),
      });
    },
    [queryClient],
  );

  return { addMessage, confirmMessage, failMessage, addOptimisticMessage, clearCache };
}
