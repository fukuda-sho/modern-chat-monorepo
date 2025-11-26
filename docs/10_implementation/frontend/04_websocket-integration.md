# WebSocket 統合仕様書

## 1. 概要

本ドキュメントは、フロントエンドにおける WebSocket（Socket.IO）の統合設計を定義する。

### 1.1 バックエンド仕様との対応

本設計は [backend/02_chat_gateway.md](../backend/02_chat_gateway.md) で定義されたバックエンド WebSocket Gateway と連携する。

### 1.2 使用ライブラリ

- `socket.io-client` v4.x

---

## 2. アーキテクチャ

### 2.1 全体構成

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         React Application                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    React Components                              │   │
│  │                                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │  ChatRoom    │  │  MessageList │  │ MessageInput │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              │ useChatSocket()                         │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Custom Hook Layer                             │   │
│  │                                                                  │   │
│  │  - 接続/切断のライフサイクル管理                                   │   │
│  │  - イベントリスナーの登録/解除                                     │   │
│  │  - 送信メソッドの提供                                             │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   SocketService (Singleton)                      │   │
│  │                                                                  │   │
│  │  - socket.io-client インスタンス管理                               │   │
│  │  - JWT トークンによる認証                                          │   │
│  │  - 自動再接続（Exponential Backoff）                              │   │
│  │  - イベント発行/購読の抽象化                                       │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              │ Store Update                            │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Zustand Store                               │   │
│  │                                                                  │   │
│  │  messages: Map<roomId, Message[]>                                │   │
│  │  connectionStatus: 'connecting' | 'connected' | 'disconnected'  │   │
│  │  currentRoomId: number | null                                   │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Backend (NestJS)                                 │
│                                                                         │
│                      ChatGateway (Socket.IO)                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 責務分離

| レイヤー | 責務 |
|---------|------|
| React Component | UI 表示、ユーザーインタラクション |
| Custom Hook | React ライフサイクルとの連携 |
| SocketService | 接続管理、イベント処理、再接続ロジック |
| Zustand Store | 状態管理、React 外からのアクセス提供 |

---

## 3. SocketService 実装

### 3.1 ファイル構成

```
lib/
└── socket.ts           # SocketService クラス
```

### 3.2 実装コード

```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/features/chat/store/chat-store';

/**
 * WebSocket イベント型定義
 */
interface ServerToClientEvents {
  roomJoined: (payload: { roomId: number }) => void;
  roomLeft: (payload: { roomId: number }) => void;
  messageCreated: (payload: MessageCreatedPayload) => void;
  error: (payload: { message: string; code?: string }) => void;
}

interface ClientToServerEvents {
  joinRoom: (payload: { roomId: number }) => void;
  leaveRoom: (payload: { roomId: number }) => void;
  sendMessage: (payload: { roomId: number; content: string }) => void;
}

interface MessageCreatedPayload {
  id: number;
  roomId: number;
  userId: number;
  content: string;
  createdAt: string;
}

/**
 * 再接続設定
 */
const RECONNECT_CONFIG = {
  maxAttempts: 10,
  baseDelay: 1000,
  maxDelay: 30000,
  multiplier: 2,
} as const;

/**
 * WebSocket 接続管理サービス
 * シングルトンパターンで実装
 */
class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  /**
   * WebSocket 接続を開始
   * @param token - JWT アクセストークン
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

    useChatStore.getState().setConnectionStatus('connecting');

    this.socket = io(wsUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ['websocket', 'polling'],
      reconnection: false, // 手動で再接続を制御
    });

    this.setupEventListeners();
  }

  /**
   * WebSocket 接続を切断
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.reconnectAttempts = 0;
    useChatStore.getState().setConnectionStatus('disconnected');
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // 接続成功
    this.socket.on('connect', () => {
      console.log('[Socket] Connected');
      this.reconnectAttempts = 0;
      useChatStore.getState().setConnectionStatus('connected');
    });

    // 切断
    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      useChatStore.getState().setConnectionStatus('disconnected');

      // サーバー側からの意図的な切断でなければ再接続
      if (reason !== 'io server disconnect') {
        this.attemptReconnect();
      }
    });

    // 接続エラー
    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      useChatStore.getState().setConnectionStatus('disconnected');
      this.attemptReconnect();
    });

    // ルーム参加完了
    this.socket.on('roomJoined', (payload) => {
      console.log('[Socket] Joined room:', payload.roomId);
      useChatStore.getState().setCurrentRoom(payload.roomId);
    });

    // ルーム退出完了
    this.socket.on('roomLeft', (payload) => {
      console.log('[Socket] Left room:', payload.roomId);
      const currentRoom = useChatStore.getState().currentRoomId;
      if (currentRoom === payload.roomId) {
        useChatStore.getState().setCurrentRoom(null);
      }
    });

    // メッセージ受信
    this.socket.on('messageCreated', (payload) => {
      console.log('[Socket] Message received:', payload);
      useChatStore.getState().addMessage(payload.roomId, {
        id: payload.id,
        roomId: payload.roomId,
        userId: payload.userId,
        content: payload.content,
        createdAt: payload.createdAt,
      });
    });

    // エラー
    this.socket.on('error', (payload) => {
      console.error('[Socket] Error:', payload.message);
      // TODO: Toast で表示
    });
  }

  /**
   * 再接続を試行（Exponential Backoff）
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= RECONNECT_CONFIG.maxAttempts) {
      console.error('[Socket] Max reconnection attempts reached');
      useChatStore.getState().setConnectionStatus('error');
      return;
    }

    const delay = Math.min(
      RECONNECT_CONFIG.baseDelay *
        Math.pow(RECONNECT_CONFIG.multiplier, this.reconnectAttempts),
      RECONNECT_CONFIG.maxDelay
    );

    console.log(
      `[Socket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.socket?.connect();
    }, delay);
  }

  /**
   * ルームに参加
   */
  joinRoom(roomId: number): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected, cannot join room');
      return;
    }
    this.socket.emit('joinRoom', { roomId });
  }

  /**
   * ルームから退出
   */
  leaveRoom(roomId: number): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected, cannot leave room');
      return;
    }
    this.socket.emit('leaveRoom', { roomId });
  }

  /**
   * メッセージを送信
   */
  sendMessage(roomId: number, content: string): void {
    if (!this.socket?.connected) {
      console.warn('[Socket] Not connected, cannot send message');
      return;
    }
    this.socket.emit('sendMessage', { roomId, content });
  }

  /**
   * 接続状態を取得
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// シングルトンインスタンスをエクスポート
export const socketService = new SocketService();
```

---

## 4. カスタムフック実装

### 4.1 useChatSocket

```typescript
// features/chat/hooks/use-chat-socket.ts
'use client';

import { useEffect, useCallback } from 'react';
import { socketService } from '@/lib/socket';
import { useChatStore } from '../store/chat-store';

/**
 * WebSocket 接続を管理するカスタムフック
 *
 * @returns WebSocket 操作メソッドと接続状態
 */
export function useChatSocket() {
  const connectionStatus = useChatStore((state) => state.connectionStatus);
  const isConnected = connectionStatus === 'connected';

  // コンポーネントマウント時に接続
  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      socketService.connect(token);
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  // ルーム参加
  const joinRoom = useCallback((roomId: number) => {
    socketService.joinRoom(roomId);
  }, []);

  // ルーム退出
  const leaveRoom = useCallback((roomId: number) => {
    socketService.leaveRoom(roomId);
  }, []);

  // メッセージ送信
  const sendMessage = useCallback((roomId: number, content: string) => {
    socketService.sendMessage(roomId, content);
  }, []);

  return {
    isConnected,
    connectionStatus,
    joinRoom,
    leaveRoom,
    sendMessage,
  };
}
```

### 4.2 useSocketConnection

```typescript
// features/chat/hooks/use-socket-connection.ts
'use client';

import { useEffect } from 'react';
import { socketService } from '@/lib/socket';

/**
 * アプリ全体で WebSocket 接続を維持するフック
 * Layout コンポーネントで使用
 */
export function useSocketConnection() {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      socketService.connect(token);
    }

    // ブラウザ終了/タブ閉じ時に切断
    const handleBeforeUnload = () => {
      socketService.disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socketService.disconnect();
    };
  }, []);
}
```

---

## 5. イベントフロー

### 5.1 接続フロー

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Client    │                    │SocketService│                    │   Server    │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │
       │ connect(token)                   │                                  │
       │─────────────────────────────────>│                                  │
       │                                  │                                  │
       │                                  │ io.connect({ auth: { token } })  │
       │                                  │─────────────────────────────────>│
       │                                  │                                  │
       │                                  │          (JWT 検証)              │
       │                                  │                                  │
       │                                  │<────────── connect ──────────────│
       │                                  │                                  │
       │                                  │ setConnectionStatus('connected')│
       │<─────────────────────────────────│                                  │
       │                                  │                                  │
```

### 5.2 メッセージ送信フロー

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Client    │                    │SocketService│                    │   Server    │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │
       │ sendMessage(roomId, content)     │                                  │
       │─────────────────────────────────>│                                  │
       │                                  │                                  │
       │                                  │ emit('sendMessage', payload)    │
       │                                  │─────────────────────────────────>│
       │                                  │                                  │
       │                                  │          (DB 保存)               │
       │                                  │                                  │
       │                                  │<──── messageCreated ────────────│
       │                                  │       (room broadcast)          │
       │                                  │                                  │
       │                                  │ addMessage(roomId, message)     │
       │<─────────────────────────────────│                                  │
       │                                  │                                  │
```

### 5.3 再接続フロー

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Client    │                    │SocketService│                    │   Server    │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │
       │                                  │<──── disconnect ────────────────│
       │                                  │                                  │
       │                                  │ setConnectionStatus('disconnected')
       │<─────────────────────────────────│                                  │
       │                                  │                                  │
       │                                  │ setTimeout (1s * 2^attempt)     │
       │                                  │                                  │
       │                                  │──── connect (retry) ───────────>│
       │                                  │                                  │
       │                                  │<──── connect ──────────────────│
       │                                  │                                  │
       │                                  │ setConnectionStatus('connected')│
       │                                  │ reconnectAttempts = 0           │
       │<─────────────────────────────────│                                  │
       │                                  │                                  │
```

---

## 6. エラーハンドリング

### 6.1 エラー種別と対応

| エラー種別 | 発生条件 | 対応 |
|-----------|---------|------|
| 認証エラー | トークン無効/期限切れ | ログインページへリダイレクト |
| 接続エラー | ネットワーク障害 | 自動再接続、UI に状態表示 |
| サーバーエラー | バックエンド障害 | Toast でエラー表示 |
| ルームエラー | 存在しないルーム | エラーメッセージ表示 |

### 6.2 接続状態の UI 表示

```typescript
// components/common/connection-status.tsx
'use client';

import { useChatStore } from '@/features/chat/store/chat-store';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function ConnectionStatus() {
  const status = useChatStore((state) => state.connectionStatus);

  const statusConfig = {
    connected: {
      label: '接続中',
      icon: Wifi,
      variant: 'default' as const,
    },
    connecting: {
      label: '接続中...',
      icon: Loader2,
      variant: 'secondary' as const,
    },
    disconnected: {
      label: '切断',
      icon: WifiOff,
      variant: 'destructive' as const,
    },
    error: {
      label: 'エラー',
      icon: WifiOff,
      variant: 'destructive' as const,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className={`h-3 w-3 ${status === 'connecting' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}
```

---

## 7. テスト戦略

### 7.1 SocketService のテスト

```typescript
// lib/__tests__/socket.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { io } from 'socket.io-client';
import { socketService } from '../socket';
import { useChatStore } from '@/features/chat/store/chat-store';

vi.mock('socket.io-client');

describe('SocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.getState().setConnectionStatus('disconnected');
  });

  afterEach(() => {
    socketService.disconnect();
  });

  it('should connect with token', () => {
    const mockSocket = {
      on: vi.fn(),
      connected: false,
    };
    vi.mocked(io).mockReturnValue(mockSocket as any);

    socketService.connect('test-token');

    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: 'Bearer test-token' },
      })
    );
  });

  // 他のテストケース...
});
```

### 7.2 useChatSocket フックのテスト

```typescript
// features/chat/hooks/__tests__/use-chat-socket.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useChatSocket } from '../use-chat-socket';
import { socketService } from '@/lib/socket';

vi.mock('@/lib/socket');

describe('useChatSocket', () => {
  it('should join room', () => {
    const { result } = renderHook(() => useChatSocket());

    act(() => {
      result.current.joinRoom(1);
    });

    expect(socketService.joinRoom).toHaveBeenCalledWith(1);
  });

  // 他のテストケース...
});
```

---

## 8. 将来的な拡張

### 8.1 タイピングインジケータ

```typescript
// 追加イベント
interface ClientToServerEvents {
  // ...existing
  startTyping: (payload: { roomId: number }) => void;
  stopTyping: (payload: { roomId: number }) => void;
}

interface ServerToClientEvents {
  // ...existing
  userTyping: (payload: { roomId: number; userId: number }) => void;
  userStoppedTyping: (payload: { roomId: number; userId: number }) => void;
}
```

### 8.2 オンラインステータス

```typescript
// 追加イベント
interface ServerToClientEvents {
  // ...existing
  userOnline: (payload: { userId: number }) => void;
  userOffline: (payload: { userId: number }) => void;
  onlineUsers: (payload: { userIds: number[] }) => void;
}
```

### 8.3 既読管理

```typescript
// 追加イベント
interface ClientToServerEvents {
  // ...existing
  markAsRead: (payload: { roomId: number; messageId: number }) => void;
}

interface ServerToClientEvents {
  // ...existing
  messageRead: (payload: { roomId: number; messageId: number; userId: number }) => void;
}
```

---

## 9. 関連ドキュメント

- [03_chat-room-ui.md](./03_chat-room-ui.md) - チャット画面仕様
- [../backend/02_chat_gateway.md](../backend/02_chat_gateway.md) - バックエンド WebSocket 仕様
