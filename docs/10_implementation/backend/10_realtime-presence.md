# リアルタイムプレゼンス・タイピング機能 設計書

## 1. 概要

本ドキュメントは、Phase 1 で実装するリアルタイム機能の Backend 仕様を定義する。

### 1.1 対象機能

| 機能 | 概要 |
|------|------|
| ユーザープレゼンス | オンライン/オフライン状態のリアルタイム管理・配信 |
| タイピングインジケーター | 入力中状態のリアルタイム配信 |
| オプティミスティック更新対応 | メッセージ送信時の localId 対応 |

### 1.2 変更対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `backend/src/chat/chat.gateway.ts` | プレゼンス・タイピング管理 |
| `backend/src/chat/types/chat.types.ts` | 型定義追加 |

---

## 2. ユーザープレゼンス

### 2.1 シーケンス図

```
┌────────┐     ┌─────────────┐     ┌────────────┐
│Client A│     │ ChatGateway │     │ Client B,C │
└───┬────┘     └──────┬──────┘     └─────┬──────┘
    │                 │                   │
    │ ══════ 接続 ══════════════════════════
    │ connect()       │                   │
    │────────────────>│                   │
    │                 │ connectedUsers    │
    │                 │ Map.set(userId)   │
    │                 │                   │
    │                 │ broadcast         │
    │                 │ userOnline        │
    │                 │──────────────────>│
    │                 │                   │
    │ getOnlineUsers  │                   │
    │────────────────>│                   │
    │                 │                   │
    │ onlineUsersList │                   │
    │<────────────────│                   │
    │                 │                   │
    │ ══════ 切断 ══════════════════════════
    │ disconnect()    │                   │
    │────────────────>│                   │
    │                 │ connectedUsers    │
    │                 │ Map.delete(userId)│
    │                 │                   │
    │                 │ broadcast         │
    │                 │ userOffline       │
    │                 │──────────────────>│
```

### 2.2 データ構造

```typescript
// chat.gateway.ts

/**
 * 接続中ユーザーを管理する Map
 * key: userId
 * value: Set of socketIds（複数タブ対応）
 */
private connectedUsers: Map<number, Set<string>> = new Map();
```

### 2.3 WebSocket イベント定義

#### 2.3.1 Server → Client イベント

| Event | Payload | 説明 |
|-------|---------|------|
| `userOnline` | `UserOnlinePayload` | ユーザーがオンラインになった |
| `userOffline` | `UserOfflinePayload` | ユーザーがオフラインになった |
| `onlineUsersList` | `OnlineUsersListPayload` | オンラインユーザー一覧 |

#### 2.3.2 Client → Server イベント

| Event | Payload | 説明 |
|-------|---------|------|
| `getOnlineUsers` | `GetOnlineUsersPayload` | オンラインユーザー一覧を要求 |

### 2.4 型定義

```typescript
// backend/src/chat/types/chat.types.ts

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
  roomId?: number;  // 指定した場合、そのルームのメンバーのみ
}

/**
 * オンラインユーザー一覧レスポンスペイロード
 */
export interface OnlineUsersListPayload {
  userIds: number[];
}
```

### 2.5 実装詳細

#### 2.5.1 接続時処理 (handleConnection)

```typescript
// backend/src/chat/chat.gateway.ts

/**
 * クライアント接続時の処理
 * - connectedUsers に追加
 * - 初回接続時は全クライアントに userOnline を配信
 */
async handleConnection(client: AuthenticatedSocket): Promise<void> {
  const user = client.data.user;
  if (!user) {
    client.disconnect();
    return;
  }

  const userId = user.userId;
  const socketId = client.id;

  // connectedUsers に追加
  if (!this.connectedUsers.has(userId)) {
    this.connectedUsers.set(userId, new Set());
  }
  const userSockets = this.connectedUsers.get(userId)!;
  const isFirstConnection = userSockets.size === 0;
  userSockets.add(socketId);

  // ユーザー専用ルームに参加（メンション通知等で使用）
  client.join(`user:${userId}`);

  // 初回接続時のみオンライン通知を配信
  if (isFirstConnection) {
    this.server.emit('userOnline', {
      userId,
      username: user.username || user.email,
    } satisfies UserOnlinePayload);
  }

  this.logger.log(`Client connected: ${socketId}, User: ${userId}`);
}
```

#### 2.5.2 切断時処理 (handleDisconnect)

```typescript
// backend/src/chat/chat.gateway.ts

/**
 * クライアント切断時の処理
 * - connectedUsers から削除
 * - 最後の接続が切れた場合は全クライアントに userOffline を配信
 */
handleDisconnect(client: AuthenticatedSocket): void {
  const user = client.data.user;
  if (!user) return;

  const userId = user.userId;
  const socketId = client.id;

  const userSockets = this.connectedUsers.get(userId);
  if (userSockets) {
    userSockets.delete(socketId);

    // 最後の接続が切れた場合
    if (userSockets.size === 0) {
      this.connectedUsers.delete(userId);

      // オフライン通知を配信
      this.server.emit('userOffline', {
        userId,
      } satisfies UserOfflinePayload);
    }
  }

  // タイピング状態もクリア
  this.clearUserTyping(userId);

  this.logger.log(`Client disconnected: ${socketId}, User: ${userId}`);
}
```

#### 2.5.3 オンラインユーザー一覧取得

```typescript
// backend/src/chat/chat.gateway.ts

/**
 * オンラインユーザー一覧を取得
 * @param payload.roomId - 指定した場合、そのルームのメンバーのみ
 */
@SubscribeMessage('getOnlineUsers')
handleGetOnlineUsers(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() payload: GetOnlineUsersPayload,
): void {
  let onlineUserIds = Array.from(this.connectedUsers.keys());

  // roomId が指定された場合はフィルタリング
  // 注: 現状はルームメンバーシップがないため、全ユーザーを返す
  // Phase 3 で RoomMember 実装後にフィルタリング追加

  client.emit('onlineUsersList', {
    userIds: onlineUserIds,
  } satisfies OnlineUsersListPayload);
}

/**
 * 指定ユーザーがオンラインかどうかを確認
 */
isUserOnline(userId: number): boolean {
  return this.connectedUsers.has(userId);
}

/**
 * オンラインユーザー数を取得
 */
getOnlineUserCount(): number {
  return this.connectedUsers.size;
}
```

---

## 3. タイピングインジケーター

### 3.1 シーケンス図

```
┌────────┐     ┌─────────────┐     ┌──────────────┐
│Client A│     │ ChatGateway │     │ Room Members │
└───┬────┘     └──────┬──────┘     └──────┬───────┘
    │                 │                    │
    │ startTyping     │                    │
    │ {roomId: 1}     │                    │
    │────────────────>│                    │
    │                 │                    │
    │                 │ to(roomId).emit    │
    │                 │ userTyping         │
    │                 │ {isTyping: true}   │
    │                 │───────────────────>│
    │                 │                    │
    │                 │ setTimeout(5s)     │
    │                 │ auto stopTyping    │
    │                 │                    │
    │ ─── 5秒経過 or stopTyping ───────────│
    │                 │                    │
    │                 │ to(roomId).emit    │
    │                 │ userTyping         │
    │                 │ {isTyping: false}  │
    │                 │───────────────────>│
```

### 3.2 データ構造

```typescript
// chat.gateway.ts

/**
 * タイピング状態の自動タイムアウトを管理する Map
 * key: `${roomId}:${userId}`
 * value: NodeJS.Timeout
 */
private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

/**
 * タイピングタイムアウト時間（ミリ秒）
 */
private readonly TYPING_TIMEOUT_MS = 5000;
```

### 3.3 WebSocket イベント定義

#### 3.3.1 Client → Server イベント

| Event | Payload | 説明 |
|-------|---------|------|
| `startTyping` | `StartTypingPayload` | 入力開始 |
| `stopTyping` | `StopTypingPayload` | 入力終了 |

#### 3.3.2 Server → Client イベント

| Event | Payload | 説明 |
|-------|---------|------|
| `userTyping` | `UserTypingPayload` | タイピング状態変更通知 |

### 3.4 型定義

```typescript
// backend/src/chat/types/chat.types.ts

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
```

### 3.5 実装詳細

#### 3.5.1 タイピング開始処理

```typescript
// backend/src/chat/chat.gateway.ts

/**
 * タイピング開始イベントハンドラ
 * - ルームの他メンバーに通知
 * - 5秒後に自動で停止
 */
@SubscribeMessage('startTyping')
handleStartTyping(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() payload: StartTypingPayload,
): void {
  const user = client.data.user;
  if (!user) return;

  const { roomId } = payload;
  const userId = user.userId;
  const key = `${roomId}:${userId}`;

  // 既存のタイムアウトをクリア
  this.clearTypingTimeout(key);

  // ルームの他メンバーに通知（自分以外）
  client.to(roomId.toString()).emit('userTyping', {
    roomId,
    userId,
    username: user.username || user.email,
    isTyping: true,
  } satisfies UserTypingPayload);

  // 5秒後に自動でタイピング停止
  const timeout = setTimeout(() => {
    this.emitStopTyping(client, roomId, userId, user.username || user.email);
    this.typingTimeouts.delete(key);
  }, this.TYPING_TIMEOUT_MS);

  this.typingTimeouts.set(key, timeout);
}
```

#### 3.5.2 タイピング終了処理

```typescript
// backend/src/chat/chat.gateway.ts

/**
 * タイピング終了イベントハンドラ
 */
@SubscribeMessage('stopTyping')
handleStopTyping(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() payload: StopTypingPayload,
): void {
  const user = client.data.user;
  if (!user) return;

  const { roomId } = payload;
  const userId = user.userId;
  const key = `${roomId}:${userId}`;

  // タイムアウトをクリア
  this.clearTypingTimeout(key);

  // タイピング停止を通知
  this.emitStopTyping(client, roomId, userId, user.username || user.email);
}

/**
 * タイピング停止を配信
 */
private emitStopTyping(
  client: AuthenticatedSocket,
  roomId: number,
  userId: number,
  username: string,
): void {
  client.to(roomId.toString()).emit('userTyping', {
    roomId,
    userId,
    username,
    isTyping: false,
  } satisfies UserTypingPayload);
}

/**
 * タイピングタイムアウトをクリア
 */
private clearTypingTimeout(key: string): void {
  const existingTimeout = this.typingTimeouts.get(key);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    this.typingTimeouts.delete(key);
  }
}

/**
 * ユーザーの全タイピング状態をクリア（切断時に使用）
 */
private clearUserTyping(userId: number): void {
  for (const [key, timeout] of this.typingTimeouts.entries()) {
    if (key.endsWith(`:${userId}`)) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(key);
    }
  }
}
```

---

## 4. オプティミスティック更新対応

### 4.1 概要

フロントエンドでオプティミスティック更新を実現するため、メッセージ送信時に `localId` を受け取り、レスポンスに含めて返す。

### 4.2 型定義変更

```typescript
// backend/src/chat/types/chat.types.ts

/**
 * メッセージ送信ペイロード（既存を拡張）
 */
export interface SendMessagePayload {
  roomId: number;
  content: string;
  localId?: string;  // 追加: オプティミスティック更新用
}

/**
 * メッセージ作成通知ペイロード（既存を拡張）
 */
export interface MessageCreatedPayload {
  id: number;
  roomId: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
  localId?: string;  // 追加: オプティミスティック更新用
}
```

### 4.3 実装変更

```typescript
// backend/src/chat/chat.gateway.ts

/**
 * メッセージ送信ハンドラ（既存を修正）
 */
@SubscribeMessage('sendMessage')
async handleSendMessage(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() payload: SendMessagePayload,
): Promise<void> {
  const user = client.data.user;
  if (!user) return;

  const { roomId, content, localId } = payload;

  try {
    // メッセージを保存
    const message = await this.prisma.message.create({
      data: {
        content,
        userId: user.userId,
        chatRoomId: roomId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // タイピング状態をクリア
    const typingKey = `${roomId}:${user.userId}`;
    this.clearTypingTimeout(typingKey);

    // ルーム全体に配信（localId を含める）
    const messagePayload: MessageCreatedPayload = {
      id: message.id,
      roomId: message.chatRoomId,
      userId: message.userId,
      username: message.user.username || message.user.email,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      localId,  // オプティミスティック更新用
    };

    this.server.to(roomId.toString()).emit('messageCreated', messagePayload);

  } catch (error) {
    this.logger.error(`Failed to send message: ${error}`);

    // エラー時も localId を含めて通知
    client.emit('error', {
      message: 'メッセージの送信に失敗しました',
      code: 'MESSAGE_SEND_FAILED',
      localId,
    });
  }
}
```

---

## 5. 完全な型定義ファイル

```typescript
// backend/src/chat/types/chat.types.ts

// ========================================
// 既存の型定義
// ========================================

export interface JoinRoomPayload {
  roomId: number;
}

export interface LeaveRoomPayload {
  roomId: number;
}

export interface RoomJoinedPayload {
  roomId: number;
}

export interface RoomLeftPayload {
  roomId: number;
}

// ========================================
// メッセージ関連（localId 対応）
// ========================================

/**
 * メッセージ送信ペイロード
 */
export interface SendMessagePayload {
  roomId: number;
  content: string;
  localId?: string;
}

/**
 * メッセージ作成通知ペイロード
 */
export interface MessageCreatedPayload {
  id: number;
  roomId: number;
  userId: number;
  username: string;
  content: string;
  createdAt: string;
  localId?: string;
}

/**
 * エラーペイロード
 */
export interface ErrorPayload {
  message: string;
  code?: string;
  localId?: string;
}

// ========================================
// プレゼンス関連（Phase 1 追加）
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
// タイピング関連（Phase 1 追加）
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
// Socket イベント名定義
// ========================================

/**
 * Client → Server イベント
 */
export const ClientEvents = {
  JOIN_ROOM: 'joinRoom',
  LEAVE_ROOM: 'leaveRoom',
  SEND_MESSAGE: 'sendMessage',
  GET_ONLINE_USERS: 'getOnlineUsers',
  START_TYPING: 'startTyping',
  STOP_TYPING: 'stopTyping',
} as const;

/**
 * Server → Client イベント
 */
export const ServerEvents = {
  ROOM_JOINED: 'roomJoined',
  ROOM_LEFT: 'roomLeft',
  MESSAGE_CREATED: 'messageCreated',
  ERROR: 'error',
  USER_ONLINE: 'userOnline',
  USER_OFFLINE: 'userOffline',
  ONLINE_USERS_LIST: 'onlineUsersList',
  USER_TYPING: 'userTyping',
} as const;
```

---

## 6. Gateway 完全実装

以下は、Phase 1 の変更を含む `chat.gateway.ts` の完全な実装例である。

```typescript
// backend/src/chat/chat.gateway.ts

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { AuthenticatedSocket } from './types/authenticated-socket';
import {
  JoinRoomPayload,
  LeaveRoomPayload,
  SendMessagePayload,
  GetOnlineUsersPayload,
  StartTypingPayload,
  StopTypingPayload,
  MessageCreatedPayload,
  UserOnlinePayload,
  UserOfflinePayload,
  OnlineUsersListPayload,
  UserTypingPayload,
  ErrorPayload,
} from './types/chat.types';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
})
@UseGuards(WsJwtAuthGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  /**
   * 接続中ユーザーを管理する Map
   * key: userId, value: Set of socketIds
   */
  private connectedUsers: Map<number, Set<string>> = new Map();

  /**
   * タイピング状態の自動タイムアウトを管理する Map
   * key: `${roomId}:${userId}`, value: Timeout
   */
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * タイピングタイムアウト時間（ミリ秒）
   */
  private readonly TYPING_TIMEOUT_MS = 5000;

  constructor(private readonly prisma: PrismaService) {}

  // ========================================
  // 接続・切断ハンドラ
  // ========================================

  /**
   * クライアント接続時の処理
   */
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const user = client.data.user;
    if (!user) {
      this.logger.warn(`Unauthenticated client attempted to connect: ${client.id}`);
      client.disconnect();
      return;
    }

    const userId = user.userId;
    const socketId = client.id;

    // connectedUsers に追加
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    const userSockets = this.connectedUsers.get(userId)!;
    const isFirstConnection = userSockets.size === 0;
    userSockets.add(socketId);

    // ユーザー専用ルームに参加
    client.join(`user:${userId}`);

    // 初回接続時のみオンライン通知を配信
    if (isFirstConnection) {
      this.server.emit('userOnline', {
        userId,
        username: user.username || user.email,
      } satisfies UserOnlinePayload);
    }

    this.logger.log(`Client connected: ${socketId}, User: ${userId}`);
  }

  /**
   * クライアント切断時の処理
   */
  handleDisconnect(client: AuthenticatedSocket): void {
    const user = client.data.user;
    if (!user) return;

    const userId = user.userId;
    const socketId = client.id;

    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);

      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
        this.server.emit('userOffline', {
          userId,
        } satisfies UserOfflinePayload);
      }
    }

    // タイピング状態をクリア
    this.clearUserTyping(userId);

    this.logger.log(`Client disconnected: ${socketId}, User: ${userId}`);
  }

  // ========================================
  // ルーム参加・退出
  // ========================================

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinRoomPayload,
  ): void {
    const { roomId } = payload;
    client.join(roomId.toString());
    client.emit('roomJoined', { roomId });
    this.logger.log(`User ${client.data.user?.userId} joined room ${roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: LeaveRoomPayload,
  ): void {
    const { roomId } = payload;
    client.leave(roomId.toString());
    client.emit('roomLeft', { roomId });
    this.logger.log(`User ${client.data.user?.userId} left room ${roomId}`);
  }

  // ========================================
  // メッセージ送信
  // ========================================

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessagePayload,
  ): Promise<void> {
    const user = client.data.user;
    if (!user) return;

    const { roomId, content, localId } = payload;

    try {
      const message = await this.prisma.message.create({
        data: {
          content,
          userId: user.userId,
          chatRoomId: roomId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      // タイピング状態をクリア
      const typingKey = `${roomId}:${user.userId}`;
      this.clearTypingTimeout(typingKey);

      const messagePayload: MessageCreatedPayload = {
        id: message.id,
        roomId: message.chatRoomId,
        userId: message.userId,
        username: message.user.username || message.user.email,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        localId,
      };

      this.server.to(roomId.toString()).emit('messageCreated', messagePayload);

    } catch (error) {
      this.logger.error(`Failed to send message: ${error}`);
      client.emit('error', {
        message: 'メッセージの送信に失敗しました',
        code: 'MESSAGE_SEND_FAILED',
        localId,
      } satisfies ErrorPayload);
    }
  }

  // ========================================
  // プレゼンス
  // ========================================

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: GetOnlineUsersPayload,
  ): void {
    const onlineUserIds = Array.from(this.connectedUsers.keys());

    client.emit('onlineUsersList', {
      userIds: onlineUserIds,
    } satisfies OnlineUsersListPayload);
  }

  /**
   * 指定ユーザーがオンラインかどうかを確認
   */
  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * オンラインユーザー数を取得
   */
  getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }

  // ========================================
  // タイピングインジケーター
  // ========================================

  @SubscribeMessage('startTyping')
  handleStartTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: StartTypingPayload,
  ): void {
    const user = client.data.user;
    if (!user) return;

    const { roomId } = payload;
    const userId = user.userId;
    const key = `${roomId}:${userId}`;

    // 既存のタイムアウトをクリア
    this.clearTypingTimeout(key);

    // ルームの他メンバーに通知
    client.to(roomId.toString()).emit('userTyping', {
      roomId,
      userId,
      username: user.username || user.email,
      isTyping: true,
    } satisfies UserTypingPayload);

    // 5秒後に自動でタイピング停止
    const timeout = setTimeout(() => {
      this.emitStopTyping(client, roomId, userId, user.username || user.email);
      this.typingTimeouts.delete(key);
    }, this.TYPING_TIMEOUT_MS);

    this.typingTimeouts.set(key, timeout);
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: StopTypingPayload,
  ): void {
    const user = client.data.user;
    if (!user) return;

    const { roomId } = payload;
    const userId = user.userId;
    const key = `${roomId}:${userId}`;

    this.clearTypingTimeout(key);
    this.emitStopTyping(client, roomId, userId, user.username || user.email);
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  private emitStopTyping(
    client: AuthenticatedSocket,
    roomId: number,
    userId: number,
    username: string,
  ): void {
    client.to(roomId.toString()).emit('userTyping', {
      roomId,
      userId,
      username,
      isTyping: false,
    } satisfies UserTypingPayload);
  }

  private clearTypingTimeout(key: string): void {
    const existingTimeout = this.typingTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(key);
    }
  }

  private clearUserTyping(userId: number): void {
    for (const [key, timeout] of this.typingTimeouts.entries()) {
      if (key.endsWith(`:${userId}`)) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(key);
      }
    }
  }
}
```

---

## 7. テスト観点

### 7.1 ユーザープレゼンス

| テストケース | 期待結果 |
|-------------|----------|
| ユーザーが初めて接続する | `userOnline` が全クライアントに配信される |
| 同一ユーザーが2つ目のタブで接続 | `userOnline` は配信されない |
| ユーザーが1つのタブを閉じる（他タブあり） | `userOffline` は配信されない |
| ユーザーが最後のタブを閉じる | `userOffline` が全クライアントに配信される |
| `getOnlineUsers` を送信 | `onlineUsersList` が返される |

### 7.2 タイピングインジケーター

| テストケース | 期待結果 |
|-------------|----------|
| `startTyping` を送信 | ルームの他メンバーに `userTyping(isTyping: true)` が配信 |
| `stopTyping` を送信 | ルームの他メンバーに `userTyping(isTyping: false)` が配信 |
| `startTyping` 後5秒経過 | 自動で `userTyping(isTyping: false)` が配信 |
| `startTyping` を連続送信 | タイムアウトがリセットされる |
| ユーザーが切断 | タイピング状態がクリアされる |

### 7.3 オプティミスティック更新

| テストケース | 期待結果 |
|-------------|----------|
| `localId` 付きでメッセージ送信 | `messageCreated` に `localId` が含まれる |
| `localId` なしでメッセージ送信 | `messageCreated` の `localId` は undefined |
| メッセージ送信失敗 | `error` に `localId` が含まれる |

---

## 8. 実装チェックリスト

- [ ] `chat.types.ts` に型定義を追加
- [ ] `chat.gateway.ts` に `connectedUsers` Map を追加
- [ ] `chat.gateway.ts` に `typingTimeouts` Map を追加
- [ ] `handleConnection` でプレゼンス管理を実装
- [ ] `handleDisconnect` でプレゼンス管理を実装
- [ ] `getOnlineUsers` イベントハンドラを追加
- [ ] `startTyping` イベントハンドラを追加
- [ ] `stopTyping` イベントハンドラを追加
- [ ] `sendMessage` に `localId` 対応を追加
- [ ] ユニットテストを作成
- [ ] E2E テストを作成
