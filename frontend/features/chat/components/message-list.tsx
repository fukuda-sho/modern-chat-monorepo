/**
 * @fileoverview メッセージリストコンポーネント
 * @description メッセージ履歴を無限スクロールで表示（Slack 風 UX）
 * - 初回ロード時に最新メッセージを表示
 * - 上スクロールで古いメッセージを追加読み込み
 * - リアルタイムメッセージを下部に追加
 */

'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { MessageItem } from './message-item';
import { DateSeparator } from './date-separator';
import { LoadMoreTrigger } from './load-more-trigger';
import { useRoomMessages } from '../hooks/use-room-messages';
import { groupMessagesByDate } from '../utils/message-utils';
import { useCurrentUser } from '@/features/auth';
import { cn } from '@/lib/utils';
import type { MessageListItem, Message } from '@/types';

interface MessageListProps {
  /** ルーム ID */
  roomId: number;
  /** 追加の CSS クラス名 */
  className?: string;
  /** 新着メッセージ受信時のコールバック */
  onNewMessage?: (message: Message) => void;
}

/**
 * メッセージリストコンポーネント（Slack 風）
 * - 初回ロード時に最新メッセージを表示
 * - 上スクロールで古いメッセージを追加読み込み
 * - リアルタイムメッセージを下部に追加
 *
 * @param props - メッセージリスト用 props
 * @returns メッセージリストの JSX 要素
 */
export function MessageList({ roomId, className }: MessageListProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);
  const initialScrollDone = useRef(false);

  const { data: currentUser } = useCurrentUser();

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRoomMessages(roomId);

  // メッセージを日付でグループ化
  const messageItems: MessageListItem[] = useMemo(() => {
    if (!data?.pages) return [];

    // 全ページのメッセージをフラット化（古い順に並べる）
    const allMessages = data.pages
      .flatMap((page) => page.data)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    return groupMessagesByDate(allMessages);
  }, [data?.pages]);

  // スクロール位置の監視
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // 最下部付近かどうかを判定（50px の余裕）
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
  }, []);

  // 古いメッセージ読み込み後、スクロール位置を維持
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isFetchingNextPage) return;

    // スクロール位置を復元
    if (prevScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight;
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
      container.scrollTop += scrollDiff;
    }
  }, [data?.pages?.length, isFetchingNextPage]);

  // 追加読み込みのトリガー
  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const container = containerRef.current;
    if (container) {
      prevScrollHeightRef.current = container.scrollHeight;
    }

    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 初回ロード完了時に最下部にスクロール
  useEffect(() => {
    if (!isLoading && messageItems.length > 0 && !initialScrollDone.current) {
      // 少し待ってからスクロール（DOM 更新待ち）
      setTimeout(() => {
        bottomRef.current?.scrollIntoView();
        initialScrollDone.current = true;
      }, 100);
    }
  }, [isLoading, messageItems.length]);

  // 新しいメッセージが追加されたときに最下部にいれば自動スクロール
  useEffect(() => {
    if (isNearBottomRef.current && initialScrollDone.current && messageItems.length > 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messageItems.length]);

  // ルームが変わったらスクロール状態をリセット
  useEffect(() => {
    initialScrollDone.current = false;
    prevScrollHeightRef.current = 0;
    isNearBottomRef.current = true;
  }, [roomId]);

  if (isLoading) {
    return (
      <div className={cn('flex flex-1 items-center justify-center', className)}>
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn('flex flex-1 items-center justify-center', className)}>
        <p className="text-destructive">
          メッセージの読み込みに失敗しました: {error?.message}
        </p>
      </div>
    );
  }

  if (messageItems.length === 0) {
    return (
      <div className={cn('flex flex-1 items-center justify-center', className)}>
        <p className="text-muted-foreground">
          まだメッセージがありません。最初のメッセージを送信しましょう！
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-1 flex-col overflow-y-auto px-4', className)}
      onScroll={handleScroll}
    >
      {/* 追加読み込みトリガー */}
      {hasNextPage && (
        <LoadMoreTrigger
          onIntersect={handleLoadMore}
          isLoading={isFetchingNextPage}
        />
      )}

      {/* メッセージリスト */}
      <div className="space-y-2 py-4">
        {messageItems.map((item, index) =>
          item.type === 'date-separator' ? (
            <DateSeparator key={`date-${item.date}-${index}`} date={item.date} />
          ) : (
            <MessageItem
              key={item.data.localId || item.data.id}
              message={item.data}
              isOwn={item.data.userId === currentUser?.id}
            />
          ),
        )}
      </div>

      {/* 最下部アンカー */}
      <div ref={bottomRef} />
    </div>
  );
}
