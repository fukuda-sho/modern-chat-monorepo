# チャットルーム画面仕様書

## 1. 概要

本ドキュメントは、チャットルーム一覧画面と個別チャットルーム画面の実装仕様を定義する。

### 1.1 対象画面

| 画面 | パス | 概要 |
|------|------|------|
| ルーム一覧 | `/chat` | 参加可能なチャットルーム一覧 |
| チャットルーム | `/chat/[roomId]` | メッセージの送受信 |

### 1.2 バックエンド連携

**REST API:**

| エンドポイント | メソッド | 用途 |
|---------------|---------|------|
| `/rooms` | GET | ルーム一覧取得（将来実装） |
| `/rooms/:id/messages` | GET | 過去メッセージ取得（将来実装） |

**WebSocket イベント:**

| イベント | 方向 | 用途 |
|---------|------|------|
| `joinRoom` | Client → Server | ルーム参加 |
| `leaveRoom` | Client → Server | ルーム退出 |
| `sendMessage` | Client → Server | メッセージ送信 |
| `roomJoined` | Server → Client | 参加完了通知 |
| `roomLeft` | Server → Client | 退出完了通知 |
| `messageCreated` | Server → Client | 新規メッセージ受信 |
| `error` | Server → Client | エラー通知 |

---

## 2. 画面設計

### 2.1 全体レイアウト

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Header                                                     [User] [⚙] │
├─────────────┬───────────────────────────────────────────────────────────┤
│             │                                                           │
│  Sidebar    │                    Main Content                           │
│             │                                                           │
│  - Room 1   │  ┌─────────────────────────────────────────────────────┐  │
│  - Room 2   │  │                                                     │  │
│  - Room 3   │  │                  Message List                       │  │
│    ...      │  │                                                     │  │
│             │  │  ┌──────────────────────────────────┐               │  │
│             │  │  │ [Avatar] User: Hello!            │               │  │
│             │  │  └──────────────────────────────────┘               │  │
│             │  │                                                     │  │
│             │  │  ┌──────────────────────────────────┐               │  │
│             │  │  │         Hi there! :User [Avatar] │               │  │
│             │  │  └──────────────────────────────────┘               │  │
│             │  │                                                     │  │
│             │  └─────────────────────────────────────────────────────┘  │
│             │                                                           │
│             │  ┌─────────────────────────────────────────────────────┐  │
│             │  │  [                Input                    ] [Send] │  │
│             │  └─────────────────────────────────────────────────────┘  │
│             │                                                           │
└─────────────┴───────────────────────────────────────────────────────────┘
```

### 2.2 レスポンシブ対応

| ブレークポイント | レイアウト |
|-----------------|-----------|
| `sm` (< 768px) | サイドバー非表示、ハンバーガーメニュー |
| `md` (768px+) | サイドバー表示（折りたたみ可能） |
| `lg` (1024px+) | サイドバー常時表示 |

### 2.3 チャットルーム画面詳細

```
┌─────────────────────────────────────────────────────────────┐
│  Room Header                                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [<] Room Name                              [Users: 3] │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      Message Area                           │
│                   (Scrollable, Flex-grow)                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [A] john_doe                              10:30 AM  │    │
│  │     Hello, everyone!                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│               ┌─────────────────────────────────────────┐   │
│               │                            10:31 AM [A] │   │
│               │                     Hi John! How are you? │   │
│               └─────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [A] alice                                 10:32 AM  │    │
│  │     Great to see you both here!                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│                          ↓ New Messages ↓                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Type a message...                            [Send]  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. コンポーネント設計

### 3.1 ファイル構成

```
features/chat/
├── components/
│   ├── chat-room.tsx              # チャットルームコンテナ
│   ├── room-header.tsx            # ルームヘッダー
│   ├── message-list.tsx           # メッセージ一覧
│   ├── message-item.tsx           # 個別メッセージ
│   ├── message-input.tsx          # メッセージ入力
│   ├── room-list.tsx              # サイドバーのルーム一覧
│   ├── room-item.tsx              # 個別ルーム項目
│   ├── typing-indicator.tsx       # タイピング中表示（将来）
│   ├── online-status.tsx          # オンライン状態（将来）
│   └── empty-room.tsx             # ルーム未選択時
├── hooks/
│   ├── use-chat-socket.ts         # WebSocket 管理
│   ├── use-messages.ts            # メッセージ状態
│   ├── use-rooms.ts               # ルーム一覧
│   └── use-scroll-to-bottom.ts    # 自動スクロール
├── store/
│   └── chat-store.ts              # Zustand ストア
├── types/
│   └── index.ts
└── index.ts
```

### 3.2 コンポーネント詳細

#### 3.2.1 ChatRoom（コンテナ）

```typescript
// features/chat/components/chat-room.tsx
'use client';

import { useEffect } from 'react';
import { useChatSocket } from '../hooks/use-chat-socket';
import { useChatStore } from '../store/chat-store';
import { RoomHeader } from './room-header';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';

interface ChatRoomProps {
  roomId: number;
}

/**
 * チャットルームコンテナコンポーネント
 * - WebSocket 接続管理
 * - ルームへの参加/退出
 */
export function ChatRoom({ roomId }: ChatRoomProps) {
  const { joinRoom, leaveRoom, sendMessage, isConnected } = useChatSocket();
  const messages = useChatStore((state) => state.messages.get(roomId) || []);

  useEffect(() => {
    if (isConnected) {
      joinRoom(roomId);
    }

    return () => {
      if (isConnected) {
        leaveRoom(roomId);
      }
    };
  }, [roomId, isConnected, joinRoom, leaveRoom]);

  const handleSendMessage = (content: string) => {
    sendMessage(roomId, content);
  };

  return (
    <div className="flex h-full flex-col">
      <RoomHeader roomId={roomId} />
      <MessageList messages={messages} className="flex-1" />
      <MessageInput onSend={handleSendMessage} disabled={!isConnected} />
    </div>
  );
}
```

#### 3.2.2 MessageList

```typescript
// features/chat/components/message-list.tsx
'use client';

import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './message-item';
import { useScrollToBottom } from '../hooks/use-scroll-to-bottom';
import { useCurrentUser } from '@/features/auth';
import type { Message } from '../types';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
  className?: string;
}

/**
 * メッセージ一覧コンポーネント
 * - 新規メッセージ受信時に自動スクロール
 * - 仮想スクロール対応（大量メッセージ時）
 */
export function MessageList({ messages, className }: MessageListProps) {
  const { data: currentUser } = useCurrentUser();
  const scrollRef = useRef<HTMLDivElement>(null);

  useScrollToBottom(scrollRef, messages);

  return (
    <ScrollArea className={cn('px-4', className)}>
      <div ref={scrollRef} className="space-y-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
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
```

#### 3.2.3 MessageItem

```typescript
// features/chat/components/message-item.tsx
'use client';

import { memo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatMessageTime } from '../utils/format-time';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

/**
 * 個別メッセージコンポーネント
 * - 自分のメッセージは右寄せ
 * - 他人のメッセージは左寄せ
 */
function MessageItemComponent({ message, isOwn }: MessageItemProps) {
  return (
    <div
      className={cn(
        'flex items-end gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {!isOwn && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            {message.userId.toString().slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        <p className="break-words text-sm">{message.content}</p>
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
```

#### 3.2.4 MessageInput

```typescript
// features/chat/components/message-input.tsx
'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

/**
 * メッセージ入力コンポーネント
 * - Enter で送信（Shift+Enter で改行）
 * - 空メッセージは送信不可
 */
export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setContent('');
    }
  }, [content, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          disabled={disabled}
          className="min-h-[44px] max-h-[120px] resize-none"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !content.trim()}
          size="icon"
          className="h-11 w-11 shrink-0"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">送信</span>
        </Button>
      </div>
    </div>
  );
}
```

#### 3.2.5 RoomList（サイドバー）

```typescript
// features/chat/components/room-list.tsx
'use client';

import { useParams } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoomItem } from './room-item';

// MVP: ハードコードされたルーム一覧（将来的にはAPIから取得）
const MOCK_ROOMS = [
  { id: 1, name: 'General' },
  { id: 2, name: 'Random' },
  { id: 3, name: 'Development' },
];

/**
 * ルーム一覧コンポーネント
 */
export function RoomList() {
  const params = useParams();
  const currentRoomId = params.roomId ? Number(params.roomId) : null;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        <h2 className="px-2 py-1 text-sm font-semibold text-muted-foreground">
          Channels
        </h2>
        {MOCK_ROOMS.map((room) => (
          <RoomItem
            key={room.id}
            room={room}
            isActive={room.id === currentRoomId}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
```

---

## 4. Zustand ストア

### 4.1 chat-store.ts

```typescript
// features/chat/store/chat-store.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

export interface Message {
  id: number;
  roomId: number;
  userId: number;
  content: string;
  createdAt: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface ChatState {
  // State
  messages: Map<number, Message[]>;
  connectionStatus: ConnectionStatus;
  currentRoomId: number | null;

  // Actions
  addMessage: (roomId: number, message: Message) => void;
  setMessages: (roomId: number, messages: Message[]) => void;
  clearMessages: (roomId: number) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setCurrentRoom: (roomId: number | null) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial State
      messages: new Map(),
      connectionStatus: 'disconnected',
      currentRoomId: null,

      // Actions
      addMessage: (roomId, message) =>
        set(
          (state) => {
            const newMessages = new Map(state.messages);
            const roomMessages = newMessages.get(roomId) || [];
            newMessages.set(roomId, [...roomMessages, message]);
            return { messages: newMessages };
          },
          false,
          'addMessage'
        ),

      setMessages: (roomId, messages) =>
        set(
          (state) => {
            const newMessages = new Map(state.messages);
            newMessages.set(roomId, messages);
            return { messages: newMessages };
          },
          false,
          'setMessages'
        ),

      clearMessages: (roomId) =>
        set(
          (state) => {
            const newMessages = new Map(state.messages);
            newMessages.delete(roomId);
            return { messages: newMessages };
          },
          false,
          'clearMessages'
        ),

      setConnectionStatus: (status) =>
        set({ connectionStatus: status }, false, 'setConnectionStatus'),

      setCurrentRoom: (roomId) =>
        set({ currentRoomId: roomId }, false, 'setCurrentRoom'),
    })),
    { name: 'chat-store' }
  )
);
```

---

## 5. カスタムフック

### 5.1 useScrollToBottom

```typescript
// features/chat/hooks/use-scroll-to-bottom.ts
import { useEffect, RefObject } from 'react';
import type { Message } from '../types';

/**
 * メッセージ更新時に自動スクロール
 */
export function useScrollToBottom(
  ref: RefObject<HTMLDivElement>,
  messages: Message[]
) {
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [messages, ref]);
}
```

### 5.2 useMessages

```typescript
// features/chat/hooks/use-messages.ts
import { useChatStore } from '../store/chat-store';

/**
 * 特定ルームのメッセージを取得
 */
export function useMessages(roomId: number) {
  return useChatStore((state) => state.messages.get(roomId) || []);
}
```

---

## 6. ページコンポーネント

### 6.1 ルーム一覧ページ

```typescript
// app/(main)/chat/page.tsx
import { EmptyRoom } from '@/features/chat/components/empty-room';

export default function ChatPage() {
  return <EmptyRoom />;
}
```

### 6.2 チャットルームページ

```typescript
// app/(main)/chat/[roomId]/page.tsx
import { ChatRoom } from '@/features/chat';

interface ChatRoomPageProps {
  params: {
    roomId: string;
  };
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  const roomId = Number(params.roomId);

  if (isNaN(roomId)) {
    return <div>Invalid room ID</div>;
  }

  return <ChatRoom roomId={roomId} />;
}
```

---

## 7. スタイリング

### 7.1 メッセージバブルのデザイン

```typescript
// 自分のメッセージ
const ownMessageClasses = cn(
  'bg-primary text-primary-foreground',
  'rounded-2xl rounded-br-sm', // 右下角のみ角張らせる
);

// 他人のメッセージ
const otherMessageClasses = cn(
  'bg-muted',
  'rounded-2xl rounded-bl-sm', // 左下角のみ角張らせる
);
```

### 7.2 レスポンシブサイドバー

```css
/* Tailwind classes */
.sidebar {
  @apply hidden md:flex md:w-64 lg:w-72;
  @apply flex-col border-r bg-muted/40;
}

.main-content {
  @apply flex-1;
}
```

---

## 8. パフォーマンス最適化

### 8.1 仮想スクロール（将来実装）

大量メッセージ時のパフォーマンス対策として `@tanstack/react-virtual` を使用。

```typescript
// features/chat/components/virtualized-message-list.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedMessageList({ messages }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 推定メッセージ高さ
    overscan: 5,
  });

  // ...
}
```

### 8.2 メモ化

- `MessageItem` は `memo` でラップ
- セレクター関数で必要な状態のみ購読

```typescript
// Good: 特定のルームのメッセージのみ購読
const messages = useChatStore((state) => state.messages.get(roomId));

// Bad: 全状態を購読（不要な再レンダリング）
const { messages } = useChatStore();
```

---

## 9. エラーハンドリング

| 状況 | 対応 |
|------|------|
| WebSocket 切断 | 再接続中の表示、送信ボタン無効化 |
| メッセージ送信失敗 | Toast でエラー表示、再送信ボタン |
| 無効なルームID | エラーページ表示 |

---

## 10. アクセシビリティ

- [ ] メッセージリストに `role="log"` と `aria-live="polite"` を設定
- [ ] 送信ボタンに `aria-label` を設定
- [ ] キーボードショートカット（Enter で送信）
- [ ] フォーカス管理（入力欄への自動フォーカス）

---

## 11. 関連ドキュメント

- [04_websocket-integration.md](./04_websocket-integration.md) - WebSocket 統合仕様
- [../backend/02_chat_gateway.md](../backend/02_chat_gateway.md) - バックエンド WebSocket 仕様
