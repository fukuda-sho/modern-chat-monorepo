# リアルタイムプレゼンス・タイピング機能 Frontend 設計書

## 1. 概要

本ドキュメントは、Phase 1 で実装するリアルタイム機能の Frontend 仕様を定義する。

### 1.1 対象機能

| 機能 | 概要 |
|------|------|
| ユーザープレゼンス | オンライン/オフライン状態のリアルタイム表示 |
| タイピングインジケーター | 「〇〇さんが入力中...」表示 |
| オプティミスティック更新 | メッセージ送信時の即時反映（localId 対応） |

### 1.2 変更対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `frontend/types/chat.ts` | 型定義追加 |
| `frontend/lib/socket.ts` | 新イベント対応 |
| `frontend/features/presence/store/presence-store.ts` | 新規作成 |
| `frontend/components/ui/presence-indicator.tsx` | 新規作成 |
| `frontend/features/chat/components/typing-indicator.tsx` | 新規作成 |
| `frontend/features/chat/components/message-input.tsx` | タイピングイベント追加 |
| `frontend/features/chat/components/message-item.tsx` | username 表示対応 |
| `frontend/features/chat/store/chat-store.ts` | localId 対応 |

---

## 2. 型定義

### 2.1 WebSocket イベントペイロード型

```typescript
// frontend/types/chat.ts

// ========================================
// プレゼンス関連
// ========================================

/**
 * ユーザーオンライン通知ペイロード
 */
export interface UserOnlinePayload {
  userId: number;
  username: string;
}

/**
 * ユーザーオフライン通知ペイロード
 */
export interface UserOfflinePayload {
  userId: number;
}

/**
 * オンラインユーザー一覧要求ペイロード
 */
export interface GetOnlineUsersPayload {
  roomId?: number;
}

/**
 * オンラインユーザー一覧レスポンスペイロード
 */
export interface OnlineUsersListPayload {
  userIds: number[];
}

// ========================================
// タイピング関連
// ========================================

/**
 * タイピング開始ペイロード
 */
export interface StartTypingPayload {
  roomId: number;
}

/**
 * タイピング終了ペイロード
 */
export interface StopTypingPayload {
  roomId: number;
}

/**
 * タイピング状態通知ペイロード
 */
export interface UserTypingPayload {
  roomId: number;
  userId: number;
  username: string;
  isTyping: boolean;
}

// ========================================
// メッセージ関連（localId 対応）
// ========================================

/**
 * メッセージ送信ペイロード（拡張）
 */
export interface SendMessagePayload {
  roomId: number;
  content: string;
  localId?: string;
}

/**
 * メッセージ作成通知ペイロード（拡張）
 */
export interface MessageCreatedPayload {
  id: number;
  roomId: number;
  userId: number;
  username: string;  // 追加
  content: string;
  createdAt: string;
  localId?: string;  // 追加
}

/**
 * エラーペイロード（拡張）
 */
export interface ErrorPayload {
  message: string;
  code?: string;
  localId?: string;  // 追加
}
```

### 2.2 Message 型の拡張

```typescript
// frontend/types/chat.ts

export interface Message {
  id: number;
  roomId: number;
  userId: number;
  username?: string;  // 追加
  content: string;
  createdAt: string;
  localId?: string;   // オプティミスティック更新用
  isPending?: boolean; // 送信中フラグ
}
```

---

## 3. プレゼンスストア

### 3.1 ファイル構成

```
frontend/features/presence/
└── store/
    └── presence-store.ts
```

### 3.2 実装

```typescript
// frontend/features/presence/store/presence-store.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TypingUser {
  userId: number;
  username: string;
}

interface PresenceState {
  // State
  onlineUserIds: Set<number>;
  typingUsers: Map<number, TypingUser[]>; // roomId -> TypingUser[]

  // Actions
  setUserOnline: (userId: number, username: string) => void;
  setUserOffline: (userId: number) => void;
  setOnlineUsers: (userIds: number[]) => void;
  setUserTyping: (roomId: number, userId: number, username: string, isTyping: boolean) => void;
  clearTypingForRoom: (roomId: number) => void;
  reset: () => void;
}

const initialState = {
  onlineUserIds: new Set<number>(),
  typingUsers: new Map<number, TypingUser[]>(),
};

export const usePresenceStore = create<PresenceState>()(
  devtools(
    (set) => ({
      ...initialState,

      setUserOnline: (userId) =>
        set(
          (state) => ({
            onlineUserIds: new Set([...state.onlineUserIds, userId]),
          }),
          false,
          'setUserOnline'
        ),

      setUserOffline: (userId) =>
        set(
          (state) => {
            const newSet = new Set(state.onlineUserIds);
            newSet.delete(userId);
            return { onlineUserIds: newSet };
          },
          false,
          'setUserOffline'
        ),

      setOnlineUsers: (userIds) =>
        set(
          { onlineUserIds: new Set(userIds) },
          false,
          'setOnlineUsers'
        ),

      setUserTyping: (roomId, userId, username, isTyping) =>
        set(
          (state) => {
            const newTypingUsers = new Map(state.typingUsers);
            const roomTyping = newTypingUsers.get(roomId) || [];

            if (isTyping) {
              // 既に存在しなければ追加
              if (!roomTyping.some((u) => u.userId === userId)) {
                newTypingUsers.set(roomId, [...roomTyping, { userId, username }]);
              }
            } else {
              // 削除
              newTypingUsers.set(
                roomId,
                roomTyping.filter((u) => u.userId !== userId)
              );
            }

            return { typingUsers: newTypingUsers };
          },
          false,
          'setUserTyping'
        ),

      clearTypingForRoom: (roomId) =>
        set(
          (state) => {
            const newTypingUsers = new Map(state.typingUsers);
            newTypingUsers.delete(roomId);
            return { typingUsers: newTypingUsers };
          },
          false,
          'clearTypingForRoom'
        ),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'presence-store' }
  )
);
```

### 3.3 カスタムフック

```typescript
// frontend/features/presence/hooks/use-presence.ts

import { usePresenceStore } from '../store/presence-store';

/**
 * 指定ユーザーがオンラインかどうかを取得
 */
export function useIsUserOnline(userId: number): boolean {
  return usePresenceStore((state) => state.onlineUserIds.has(userId));
}

/**
 * 指定ルームでタイピング中のユーザー一覧を取得
 */
export function useTypingUsers(roomId: number): { userId: number; username: string }[] {
  return usePresenceStore((state) => state.typingUsers.get(roomId) || []);
}
```

---

## 4. Socket.IO 対応

### 4.1 イベント型定義の追加

```typescript
// frontend/lib/socket.ts

interface ServerToClientEvents {
  // 既存
  roomJoined: (payload: RoomJoinedPayload) => void;
  roomLeft: (payload: RoomLeftPayload) => void;
  messageCreated: (payload: MessageCreatedPayload) => void;
  error: (payload: ErrorPayload) => void;
  // 追加
  userOnline: (payload: UserOnlinePayload) => void;
  userOffline: (payload: UserOfflinePayload) => void;
  onlineUsersList: (payload: OnlineUsersListPayload) => void;
  userTyping: (payload: UserTypingPayload) => void;
}

interface ClientToServerEvents {
  // 既存
  joinRoom: (payload: JoinRoomPayload) => void;
  leaveRoom: (payload: LeaveRoomPayload) => void;
  sendMessage: (payload: SendMessagePayload) => void;
  // 追加
  getOnlineUsers: (payload: GetOnlineUsersPayload) => void;
  startTyping: (payload: StartTypingPayload) => void;
  stopTyping: (payload: StopTypingPayload) => void;
}
```

### 4.2 イベントリスナーの追加

```typescript
// frontend/lib/socket.ts (setupEventListeners 内に追加)

// ユーザーオンライン
this.socket.on('userOnline', (payload) => {
  console.log('[Socket] User online:', payload.userId);
  usePresenceStore.getState().setUserOnline(payload.userId, payload.username);
});

// ユーザーオフライン
this.socket.on('userOffline', (payload) => {
  console.log('[Socket] User offline:', payload.userId);
  usePresenceStore.getState().setUserOffline(payload.userId);
});

// オンラインユーザー一覧
this.socket.on('onlineUsersList', (payload) => {
  console.log('[Socket] Online users:', payload.userIds);
  usePresenceStore.getState().setOnlineUsers(payload.userIds);
});

// タイピング状態
this.socket.on('userTyping', (payload) => {
  console.log('[Socket] User typing:', payload);
  usePresenceStore.getState().setUserTyping(
    payload.roomId,
    payload.userId,
    payload.username,
    payload.isTyping
  );
});
```

### 4.3 タイピングイベント送信メソッド

```typescript
// frontend/lib/socket.ts (SocketService クラスに追加)

/**
 * タイピング開始を通知
 */
startTyping(roomId: number): void {
  if (!this.socket?.connected) return;
  this.socket.emit('startTyping', { roomId });
}

/**
 * タイピング終了を通知
 */
stopTyping(roomId: number): void {
  if (!this.socket?.connected) return;
  this.socket.emit('stopTyping', { roomId });
}

/**
 * オンラインユーザー一覧を要求
 */
getOnlineUsers(roomId?: number): void {
  if (!this.socket?.connected) return;
  this.socket.emit('getOnlineUsers', { roomId });
}
```

---

## 5. UI コンポーネント

### 5.1 PresenceIndicator

```typescript
// frontend/components/ui/presence-indicator.tsx

'use client';

import { cn } from '@/lib/utils';

type PresenceIndicatorProps = {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

export function PresenceIndicator({
  isOnline,
  size = 'md',
  className,
}: PresenceIndicatorProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-block rounded-full',
        sizeClasses[size],
        isOnline ? 'bg-green-500' : 'bg-gray-400',
        className
      )}
      aria-label={isOnline ? 'オンライン' : 'オフライン'}
    />
  );
}
```

### 5.2 TypingIndicator

```typescript
// frontend/features/chat/components/typing-indicator.tsx

'use client';

import { useTypingUsers } from '@/features/presence/hooks/use-presence';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';

type TypingIndicatorProps = {
  roomId: number;
};

export function TypingIndicator({ roomId }: TypingIndicatorProps): React.JSX.Element | null {
  const typingUsers = useTypingUsers(roomId);
  const { user } = useCurrentUser();

  // 自分を除外
  const othersTyping = typingUsers.filter((u) => u.userId !== user?.id);

  if (othersTyping.length === 0) {
    return null;
  }

  const text =
    othersTyping.length === 1
      ? `${othersTyping[0].username} さんが入力中...`
      : othersTyping.length === 2
        ? `${othersTyping[0].username} さん、${othersTyping[1].username} さんが入力中...`
        : `${othersTyping.length} 人が入力中...`;

  return (
    <div className="text-muted-foreground flex items-center gap-2 px-4 py-1 text-xs">
      <span className="flex gap-1">
        <span className="animate-bounce">.</span>
        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
      </span>
      <span>{text}</span>
    </div>
  );
}
```

---

## 6. MessageInput のタイピングイベント対応

### 6.1 実装

```typescript
// frontend/features/chat/components/message-input.tsx

'use client';

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { socketService } from '@/lib/socket';

type MessageInputProps = {
  roomId: number;
  onSend: (content: string) => void;
  disabled?: boolean;
};

const TYPING_DEBOUNCE_MS = 1000;

export function MessageInput({ roomId, onSend, disabled }: MessageInputProps): React.JSX.Element {
  const [content, setContent] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // タイピング状態の管理
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketService.startTyping(roomId);
    }

    // 既存のタイムアウトをクリア
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 1秒後にタイピング終了
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socketService.stopTyping(roomId);
      }
    }, TYPING_DEBOUNCE_MS);
  }, [roomId]);

  // コンポーネントアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        socketService.stopTyping(roomId);
      }
    };
  }, [roomId]);

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (trimmed && !disabled) {
      // タイピング状態をクリア
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socketService.stopTyping(roomId);
      }

      onSend(trimmed);
      setContent('');
    }
  }, [content, disabled, onSend, roomId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-background border-t p-4">
      <div className="flex items-end gap-2">
        <Textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          disabled={disabled}
          className="max-h-[120px] min-h-[44px] resize-none"
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
      {disabled && (
        <p className="text-muted-foreground mt-2 text-xs">
          接続中... しばらくお待ちください
        </p>
      )}
    </div>
  );
}
```

---

## 7. オプティミスティック更新

### 7.1 chat-store の拡張

```typescript
// frontend/features/chat/store/chat-store.ts

interface ChatState {
  // 既存...

  // Actions（拡張）
  addOptimisticMessage: (roomId: number, message: Message) => void;
  confirmMessage: (roomId: number, localId: string, serverMessage: Message) => void;
  failMessage: (roomId: number, localId: string) => void;
}

// 実装
addOptimisticMessage: (roomId, message) =>
  set(
    (state) => {
      const newMessages = new Map(state.messages);
      const roomMessages = newMessages.get(roomId) || [];
      newMessages.set(roomId, [...roomMessages, { ...message, isPending: true }]);
      return { messages: newMessages };
    },
    false,
    'addOptimisticMessage'
  ),

confirmMessage: (roomId, localId, serverMessage) =>
  set(
    (state) => {
      const newMessages = new Map(state.messages);
      const roomMessages = newMessages.get(roomId) || [];
      const updatedMessages = roomMessages.map((msg) =>
        msg.localId === localId ? { ...serverMessage, isPending: false } : msg
      );
      newMessages.set(roomId, updatedMessages);
      return { messages: newMessages };
    },
    false,
    'confirmMessage'
  ),

failMessage: (roomId, localId) =>
  set(
    (state) => {
      const newMessages = new Map(state.messages);
      const roomMessages = newMessages.get(roomId) || [];
      // 失敗したメッセージを削除または失敗状態に更新
      const updatedMessages = roomMessages.filter((msg) => msg.localId !== localId);
      newMessages.set(roomId, updatedMessages);
      return { messages: newMessages };
    },
    false,
    'failMessage'
  ),
```

### 7.2 メッセージ送信フロー

```typescript
// sendMessage の新しいフロー

const localId = crypto.randomUUID();

// 1. オプティミスティックに追加
useChatStore.getState().addOptimisticMessage(roomId, {
  id: -1, // 仮ID
  localId,
  roomId,
  userId: currentUser.id,
  username: currentUser.username,
  content,
  createdAt: new Date().toISOString(),
  isPending: true,
});

// 2. サーバーに送信
socketService.sendMessage(roomId, content, localId);

// 3. messageCreated イベントで確定 or error イベントで削除
```

---

## 8. 実装チェックリスト

- [ ] `types/chat.ts` に型定義を追加
- [ ] `features/presence/store/presence-store.ts` を作成
- [ ] `features/presence/hooks/use-presence.ts` を作成
- [ ] `lib/socket.ts` に新イベントを追加
- [ ] `components/ui/presence-indicator.tsx` を作成
- [ ] `features/chat/components/typing-indicator.tsx` を作成
- [ ] `features/chat/components/message-input.tsx` にタイピングイベントを追加
- [ ] `features/chat/store/chat-store.ts` にオプティミスティック更新を追加
- [ ] ユニットテストを作成
- [ ] E2E テストを作成

---

## 9. テスト観点

### 9.1 プレゼンス

| テストケース | 期待結果 |
|-------------|----------|
| userOnline 受信時 | onlineUserIds に追加される |
| userOffline 受信時 | onlineUserIds から削除される |
| PresenceIndicator でオンラインユーザー | 緑色のドット表示 |
| PresenceIndicator でオフラインユーザー | グレーのドット表示 |

### 9.2 タイピング

| テストケース | 期待結果 |
|-------------|----------|
| 入力開始時 | startTyping が送信される |
| 1秒入力なし | stopTyping が送信される |
| メッセージ送信時 | stopTyping が送信される |
| userTyping 受信時 | TypingIndicator に表示 |
| 自分のタイピング | TypingIndicator に表示されない |

### 9.3 オプティミスティック更新

| テストケース | 期待結果 |
|-------------|----------|
| メッセージ送信時 | 即座にリストに表示（isPending: true） |
| サーバー確定時 | isPending が false に |
| エラー時 | メッセージがリストから削除 |
