# メッセージ履歴表示（Slack 風 UX）

## 機能概要

| 項目 | 内容 |
|------|------|
| 機能名 | メッセージ履歴表示 |
| 対象 | Frontend（Next.js 16 / React 19） |
| 目的 | Slack のような自然なメッセージ履歴表示と無限スクロールを実現する |
| 関連機能 | Backend メッセージ履歴 API、リアルタイムメッセージング |

---

## 背景と課題

### 現状の問題

- ルーム（チャンネル / DM）に入っても「過去の会話履歴」が表示されない
- Socket.IO 接続後に届いたメッセージのみ表示され、リロードすると何も見えない
- ユーザー体験が Slack と比較して大幅に劣る

### 目標とする挙動（Slack をイメージ）

1. **ルームを開いたとき**: 直近のメッセージ履歴（例：50件）がまとめて表示される
2. **上方向スクロール**: より古いメッセージを過去にさかのぼって閲覧できる（無限スクロール）
3. **リアルタイム受信**: 新しいメッセージは下部へリアルタイム追加（Socket.IO 経由）
4. **ページリロード後**: 履歴 + 新着メッセージが切れ目なく見える

---

## 技術スタック

- **Next.js 16** (App Router)
- **React 19**
- **TanStack Query 5** (`useInfiniteQuery`)
- **Zustand 5** (UI 状態管理)
- **Socket.IO Client** (リアルタイム通信)
- **Tailwind CSS v4 + shadcn/ui** (UI)

---

## アーキテクチャ設計

### 責務分離

```
┌─────────────────────────────────────────────────────────────────┐
│                        Message Display                          │
├─────────────────────────────────────────────────────────────────┤
│  TanStack Query (useInfiniteQuery)                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ - メッセージデータのフェッチ・キャッシュ                    │   │
│  │ - ページネーション管理                                     │   │
│  │ - Socket.IO からの新着メッセージをキャッシュに追加          │   │
│  │ ★ Source of Truth for message data                        │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Zustand Store                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ - 選択中の roomId                                         │   │
│  │ - スクロール位置の保持                                     │   │
│  │ - UI 状態（ローディング、エラー表示など）                   │   │
│  │ ★ UI state only, NO message data                          │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Socket.IO Client                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ - messageCreated イベント受信                             │   │
│  │ - TanStack Query キャッシュへの追加                        │   │
│  │ - ルーム join/leave 管理                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### データフロー

```
[Initial Load]
User opens room → useInfiniteQuery fetches first page → Display messages → Auto-scroll to bottom

[Load More (上スクロール)]
Scroll near top → IntersectionObserver triggers → fetchNextPage() → Prepend older messages

[Real-time Message]
Socket.IO receives messageCreated → queryClient.setQueryData → Append to latest page → Auto-scroll (if at bottom)
```

---

## ディレクトリ構成

```
frontend/src/features/chat/
├── api/
│   └── messages-api.ts          # メッセージ履歴 API クライアント
├── hooks/
│   ├── use-room-messages.ts     # useInfiniteQuery ラッパー
│   └── use-message-socket.ts    # Socket.IO メッセージハンドラ
├── components/
│   ├── message-list.tsx         # メッセージリスト（無限スクロール対応）
│   ├── message-item.tsx         # 個別メッセージ表示
│   ├── date-separator.tsx       # 日付区切り
│   └── load-more-trigger.tsx    # 追加読み込みトリガー
├── store/
│   └── chat-store.ts            # 既存 + スクロール位置等の追加
├── types/
│   └── message.types.ts         # メッセージ関連型定義
└── utils/
    └── message-utils.ts         # ユーティリティ関数
```

---

## 型定義

### `types/message.types.ts`

```typescript
/**
 * ユーザー情報（メッセージ表示用の簡易版）
 */
export interface MessageUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * メッセージデータ
 */
export interface Message {
  id: string;
  content: string;
  roomId: string;
  userId: string;
  user: MessageUser;
  createdAt: string;
  updatedAt: string;
}

/**
 * ページネーション情報
 */
export interface MessagePagination {
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
}

/**
 * メッセージ履歴 API レスポンス
 */
export interface MessageHistoryResponse {
  data: Message[];
  pagination: MessagePagination;
}

/**
 * メッセージ取得オプション
 */
export interface GetMessagesOptions {
  limit?: number;
  cursor?: string;
  direction?: 'older' | 'newer';
}

/**
 * 日付区切り付きメッセージアイテム
 */
export type MessageListItem =
  | { type: 'message'; data: Message }
  | { type: 'date-separator'; date: string };
```

---

## API レイヤー

### `api/messages-api.ts`

```typescript
import { apiClient } from '@/lib/api-client';
import type {
  MessageHistoryResponse,
  GetMessagesOptions,
} from '../types/message.types';

const DEFAULT_LIMIT = 50;

/**
 * ルームのメッセージ履歴を取得
 * @param roomId ルームID
 * @param options ページネーションオプション
 * @returns メッセージ履歴とページネーション情報
 */
export async function fetchRoomMessages(
  roomId: string,
  options: GetMessagesOptions = {},
): Promise<MessageHistoryResponse> {
  const { limit = DEFAULT_LIMIT, cursor, direction = 'older' } = options;

  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);
  if (direction) params.set('direction', direction);

  const response = await apiClient.get<MessageHistoryResponse>(
    `/chat/rooms/${roomId}/messages?${params.toString()}`,
  );

  return response;
}
```

---

## TanStack Query フック

### `hooks/use-room-messages.ts`

```typescript
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { fetchRoomMessages } from '../api/messages-api';
import type { Message, MessageHistoryResponse } from '../types/message.types';

/** Query Key ファクトリ */
export const roomMessagesKeys = {
  all: ['roomMessages'] as const,
  room: (roomId: string) => [...roomMessagesKeys.all, roomId] as const,
};

const MESSAGES_PER_PAGE = 50;

/**
 * ルームのメッセージ履歴を取得する Infinite Query フック
 * @param roomId ルームID
 * @param enabled クエリを有効化するかどうか
 */
export function useRoomMessages(roomId: string | null, enabled = true) {
  return useInfiniteQuery({
    queryKey: roomMessagesKeys.room(roomId ?? ''),
    queryFn: async ({ pageParam }) => {
      if (!roomId) throw new Error('Room ID is required');
      return fetchRoomMessages(roomId, {
        cursor: pageParam,
        direction: 'older',
        limit: MESSAGES_PER_PAGE,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined,
    enabled: enabled && !!roomId,
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
    (roomId: string, message: Message) => {
      queryClient.setQueryData<{
        pages: MessageHistoryResponse[];
        pageParams: (string | undefined)[];
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
   * 特定のメッセージを更新
   */
  const updateMessage = useCallback(
    (roomId: string, messageId: string, updates: Partial<Message>) => {
      queryClient.setQueryData<{
        pages: MessageHistoryResponse[];
        pageParams: (string | undefined)[];
      }>(roomMessagesKeys.room(roomId), (oldData) => {
        if (!oldData) return oldData;

        const newPages = oldData.pages.map((page) => ({
          ...page,
          data: page.data.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg,
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
   * キャッシュをクリア（ルーム退出時など）
   */
  const clearCache = useCallback(
    (roomId: string) => {
      queryClient.removeQueries({
        queryKey: roomMessagesKeys.room(roomId),
      });
    },
    [queryClient],
  );

  return { addMessage, updateMessage, clearCache };
}
```

---

## Socket.IO 統合

### `hooks/use-message-socket.ts`

```typescript
import { useEffect } from 'react';
import { useSocket } from '@/lib/socket';
import { useMessageCacheUpdater } from './use-room-messages';
import type { Message } from '../types/message.types';

interface UseMessageSocketOptions {
  roomId: string | null;
  enabled?: boolean;
  onNewMessage?: (message: Message) => void;
}

/**
 * Socket.IO からのメッセージイベントを処理し、
 * TanStack Query キャッシュと同期するフック
 */
export function useMessageSocket({
  roomId,
  enabled = true,
  onNewMessage,
}: UseMessageSocketOptions) {
  const socket = useSocket();
  const { addMessage } = useMessageCacheUpdater();

  useEffect(() => {
    if (!enabled || !roomId || !socket) return;

    const handleMessageCreated = (message: Message) => {
      // 現在のルームのメッセージのみ処理
      if (message.roomId !== roomId) return;

      // TanStack Query キャッシュに追加
      addMessage(roomId, message);

      // コールバック呼び出し（スクロール処理など）
      onNewMessage?.(message);
    };

    socket.on('messageCreated', handleMessageCreated);

    return () => {
      socket.off('messageCreated', handleMessageCreated);
    };
  }, [socket, roomId, enabled, addMessage, onNewMessage]);
}
```

---

## UI コンポーネント

### `components/message-list.tsx`

```typescript
'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useRoomMessages, useMessageSocket } from '../hooks';
import { MessageItem } from './message-item';
import { DateSeparator } from './date-separator';
import { LoadMoreTrigger } from './load-more-trigger';
import { Loader2 } from 'lucide-react';
import { groupMessagesByDate } from '../utils/message-utils';
import type { Message, MessageListItem } from '../types/message.types';

interface MessageListProps {
  roomId: string;
}

/**
 * メッセージリストコンポーネント（Slack 風）
 * - 初回ロード時に最新メッセージを表示
 * - 上スクロールで古いメッセージを追加読み込み
 * - リアルタイムメッセージを下部に追加
 */
export function MessageList({ roomId }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRoomMessages(roomId);

  // 新着メッセージ受信時のコールバック
  const handleNewMessage = useCallback((message: Message) => {
    // 最下部付近にいる場合のみ自動スクロール
    if (isNearBottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  // Socket.IO 統合
  useMessageSocket({
    roomId,
    enabled: !!roomId,
    onNewMessage: handleNewMessage,
  });

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
    if (!isLoading && messageItems.length > 0) {
      bottomRef.current?.scrollIntoView();
    }
  }, [isLoading, messageItems.length]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-destructive">
          メッセージの読み込みに失敗しました: {error?.message}
        </p>
      </div>
    );
  }

  if (messageItems.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">
          まだメッセージがありません。最初のメッセージを送信しましょう！
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col overflow-y-auto px-4"
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
      {messageItems.map((item, index) =>
        item.type === 'date-separator' ? (
          <DateSeparator key={`date-${item.date}`} date={item.date} />
        ) : (
          <MessageItem key={item.data.id} message={item.data} />
        ),
      )}

      {/* 最下部アンカー */}
      <div ref={bottomRef} />
    </div>
  );
}
```

### `components/message-item.tsx`

```typescript
import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatMessageTime } from '../utils/message-utils';
import type { Message } from '../types/message.types';

interface MessageItemProps {
  message: Message;
}

/**
 * 個別メッセージ表示コンポーネント
 */
export const MessageItem = memo(function MessageItem({
  message,
}: MessageItemProps) {
  const { user, content, createdAt } = message;
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="group flex gap-3 py-2 hover:bg-muted/50">
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-foreground">{user.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatMessageTime(createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words text-foreground">
          {content}
        </p>
      </div>
    </div>
  );
});
```

### `components/date-separator.tsx`

```typescript
import { memo } from 'react';
import { formatDateSeparator } from '../utils/message-utils';

interface DateSeparatorProps {
  date: string;
}

/**
 * 日付区切りコンポーネント（Slack 風）
 */
export const DateSeparator = memo(function DateSeparator({
  date,
}: DateSeparatorProps) {
  return (
    <div className="relative my-4 flex items-center">
      <div className="flex-1 border-t border-border" />
      <span className="mx-4 flex-shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
        {formatDateSeparator(date)}
      </span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
});
```

### `components/load-more-trigger.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadMoreTriggerProps {
  onIntersect: () => void;
  isLoading: boolean;
}

/**
 * IntersectionObserver を使った追加読み込みトリガー
 */
export function LoadMoreTrigger({
  onIntersect,
  isLoading,
}: LoadMoreTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onIntersect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(trigger);

    return () => observer.disconnect();
  }, [onIntersect, isLoading]);

  return (
    <div ref={triggerRef} className="flex justify-center py-4">
      {isLoading && (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
```

---

## ユーティリティ関数

### `utils/message-utils.ts`

```typescript
import type { Message, MessageListItem } from '../types/message.types';

/**
 * メッセージを日付でグループ化し、日付区切りを挿入
 */
export function groupMessagesByDate(messages: Message[]): MessageListItem[] {
  const result: MessageListItem[] = [];
  let currentDate: string | null = null;

  for (const message of messages) {
    const messageDate = new Date(message.createdAt).toDateString();

    if (messageDate !== currentDate) {
      currentDate = messageDate;
      result.push({
        type: 'date-separator',
        date: message.createdAt,
      });
    }

    result.push({
      type: 'message',
      data: message,
    });
  }

  return result;
}

/**
 * 日付区切りのフォーマット（「今日」「昨日」「2024年11月27日」など）
 */
export function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return '今日';
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return '昨日';
  }

  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

/**
 * メッセージ時刻のフォーマット（「10:30」形式）
 */
export function formatMessageTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

---

## Zustand Store 更新

### `store/chat-store.ts`（追加項目）

```typescript
// 既存の chat-store.ts に以下を追加

interface ChatUIState {
  // ... 既存の状態 ...

  /** ルームごとのスクロール位置を保持 */
  scrollPositions: Record<string, number>;

  /** 新着メッセージインジケータの表示状態 */
  hasNewMessages: Record<string, boolean>;
}

interface ChatUIActions {
  // ... 既存のアクション ...

  /** スクロール位置を保存 */
  saveScrollPosition: (roomId: string, position: number) => void;

  /** スクロール位置を取得 */
  getScrollPosition: (roomId: string) => number;

  /** 新着メッセージフラグを設定 */
  setHasNewMessages: (roomId: string, hasNew: boolean) => void;
}

// 実装例
export const useChatStore = create<ChatUIState & ChatUIActions>()(
  devtools((set, get) => ({
    // ... 既存 ...

    scrollPositions: {},
    hasNewMessages: {},

    saveScrollPosition: (roomId, position) =>
      set((state) => ({
        scrollPositions: {
          ...state.scrollPositions,
          [roomId]: position,
        },
      })),

    getScrollPosition: (roomId) => get().scrollPositions[roomId] ?? 0,

    setHasNewMessages: (roomId, hasNew) =>
      set((state) => ({
        hasNewMessages: {
          ...state.hasNewMessages,
          [roomId]: hasNew,
        },
      })),
  })),
);
```

---

## テスト方針

### 単体テスト

#### `hooks/use-room-messages.test.ts`

```typescript
describe('useRoomMessages', () => {
  it('ルームIDを指定してメッセージを取得できること');
  it('roomId が null の場合はクエリが実行されないこと');
  it('fetchNextPage で古いメッセージを追加取得できること');
  it('hasNextPage が正しく判定されること');
});

describe('useMessageCacheUpdater', () => {
  it('addMessage でキャッシュにメッセージが追加されること');
  it('重複メッセージは追加されないこと');
  it('updateMessage でメッセージが更新されること');
  it('clearCache でキャッシュがクリアされること');
});
```

#### `components/message-list.test.tsx`

```typescript
describe('MessageList', () => {
  it('メッセージが表示されること');
  it('日付区切りが正しく挿入されること');
  it('ローディング中はスピナーが表示されること');
  it('エラー時はエラーメッセージが表示されること');
  it('メッセージが0件の場合は空メッセージが表示されること');
});
```

#### `utils/message-utils.test.ts`

```typescript
describe('groupMessagesByDate', () => {
  it('異なる日付のメッセージに区切りが挿入されること');
  it('同じ日付のメッセージには区切りが挿入されないこと');
  it('空配列を渡すと空配列が返ること');
});

describe('formatDateSeparator', () => {
  it('今日の日付は「今日」と表示されること');
  it('昨日の日付は「昨日」と表示されること');
  it('それ以外は年月日形式で表示されること');
});
```

---

## 実装ステップ

### Phase 1: 型定義とAPIレイヤー

1. [ ] `types/message.types.ts` 作成
2. [ ] `api/messages-api.ts` 作成
3. [ ] 既存の型定義との整合性確認

### Phase 2: TanStack Query フック

4. [ ] `hooks/use-room-messages.ts` 作成
5. [ ] `useMessageCacheUpdater` 実装
6. [ ] 単体テスト作成

### Phase 3: Socket.IO 統合

7. [ ] `hooks/use-message-socket.ts` 作成
8. [ ] 既存のソケット処理との統合
9. [ ] 重複メッセージ防止の確認

### Phase 4: UI コンポーネント

10. [ ] `components/message-item.tsx` 作成
11. [ ] `components/date-separator.tsx` 作成
12. [ ] `components/load-more-trigger.tsx` 作成
13. [ ] `components/message-list.tsx` 作成

### Phase 5: ユーティリティと統合

14. [ ] `utils/message-utils.ts` 作成
15. [ ] 既存のチャットページに統合
16. [ ] スクロール位置の保持実装

### Phase 6: テストと最適化

17. [ ] コンポーネントテスト作成
18. [ ] E2E テスト作成
19. [ ] パフォーマンス最適化（必要に応じて仮想スクロール導入）

---

## 将来の拡張ポイント

1. **未読境界線**: 「ここから未読」の表示
2. **未読バッジ**: サイドバーでの未読メッセージ数表示
3. **メッセージ検索**: キーワードでのメッセージ検索
4. **スレッド返信**: メッセージへの返信スレッド
5. **リアクション**: メッセージへの絵文字リアクション
6. **メッセージ編集/削除**: 自分のメッセージの編集・削除
7. **仮想スクロール**: 大量メッセージ時のパフォーマンス最適化

---

## 参考資料

- [TanStack Query - Infinite Queries](https://tanstack.com/query/latest/docs/react/guides/infinite-queries)
- [Slack 風 UI パターン](https://www.figma.com/community/file/123456) (参考)
- [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
