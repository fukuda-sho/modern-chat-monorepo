# WebSocket Chat Gateway 仕様書

## 0. 設計方針（1対1 / グループチャット拡張性）

### 0.1 ChatRoom 単位の設計

本システムでは、チャットはすべて **「ChatRoom 単位」** で扱います。WebSocket イベントは `roomId` をキーとした汎用インターフェースとして設計されており、1対1チャットとグループチャットを同一の仕組みで処理できます。

### 0.2 現在の実装

現時点では、1対1チャットとグループチャットの区別は実装していません。すべてのチャットルームは同等に扱われ、`roomId` を指定してメッセージを送受信します。

```
現在のスキーマ:
- User: ユーザー情報
- ChatRoom: チャットルーム（種別なし）
- Message: メッセージ（userId, chatRoomId で関連付け）
```

### 0.3 将来の拡張方針

LINE のような 1対1チャット / グループチャットを実現するため、将来的に以下の拡張を想定しています。

#### ChatRoom への種別追加

```typescript
// 将来追加予定のフィールド
model ChatRoom {
  id        Int       @id @default(autoincrement())
  name      String    @db.VarChar(255)
  type      String    @default("GROUP") @db.VarChar(20)  // 'DIRECT' | 'GROUP'
  createdAt DateTime  @default(now()) @map("created_at")
  messages  Message[]
  members   ChatRoomMember[]

  @@map("chat_rooms")
}
```

#### ChatRoomMember テーブルの追加

「どのユーザがどのルームに参加できるか」を管理するテーブル:

```typescript
// 将来追加予定のモデル
model ChatRoomMember {
  id         Int      @id @default(autoincrement())
  chatRoomId Int      @map("chat_room_id")
  userId     Int      @map("user_id")
  joinedAt   DateTime @default(now()) @map("joined_at")
  role       String   @default("MEMBER") @db.VarChar(20)  // 'OWNER' | 'ADMIN' | 'MEMBER'

  chatRoom ChatRoom @relation(fields: [chatRoomId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([chatRoomId, userId])
  @@map("chat_room_members")
}
```

#### 1対1チャットの実現方法

- `type: 'DIRECT'` のルームは、`ChatRoomMember` に2人のユーザーのみが登録される
- 既存の DIRECT ルームがある場合は、新規作成せず既存ルームを返す
- グループチャット (`type: 'GROUP'`) は3人以上のメンバーを持てる

### 0.4 現在の WebSocket イベントとの互換性

現在実装している WebSocket イベント（`joinRoom`, `leaveRoom`, `sendMessage`, `messageCreated`）は、将来の拡張後も変更なく利用できます。ルーム種別やメンバー管理は REST API 側で行い、WebSocket は `roomId` ベースのリアルタイム通信に専念します。

---

## 1. WebSocket イベント名リスト

### 1.1 Client → Server イベント

| イベント名 | 目的 | ペイロード |
|-----------|------|-----------|
| `joinRoom` | 特定ルームへの参加 | `{ roomId: number }` |
| `leaveRoom` | ルーム退出 | `{ roomId: number }` |
| `sendMessage` | メッセージ送信 | `{ roomId: number; content: string }` |

#### joinRoom

```typescript
// ペイロード
interface JoinRoomPayload {
  roomId: number;
}
```

#### leaveRoom

```typescript
// ペイロード
interface LeaveRoomPayload {
  roomId: number;
}
```

#### sendMessage

```typescript
// ペイロード
interface SendMessagePayload {
  roomId: number;
  content: string;
}
```

### 1.2 Server → Client イベント

| イベント名 | 目的 | ペイロード |
|-----------|------|-----------|
| `roomJoined` | ルーム参加完了通知 | `{ roomId: number }` |
| `roomLeft` | ルーム退出完了通知 | `{ roomId: number }` |
| `messageCreated` | 新規メッセージ通知 | `MessageCreatedPayload` |
| `error` | エラー通知 | `{ message: string; code?: string }` |

#### roomJoined

```typescript
interface RoomJoinedPayload {
  roomId: number;
}
```

#### roomLeft

```typescript
interface RoomLeftPayload {
  roomId: number;
}
```

#### messageCreated

```typescript
interface MessageCreatedPayload {
  id: number;
  roomId: number;
  userId: number;
  content: string;
  createdAt: string;  // ISO 8601 形式
}
```

#### error

```typescript
interface ErrorPayload {
  message: string;
  code?: string;
}
```

---

## 2. 接続時の認証フロー

### 2.1 接続 URL とトークン受け渡し

```
WebSocket URL: ws://localhost:3000
```

**トークン受け渡し方法（優先順位）:**

1. **Socket.IO の `auth` フィールド**（推奨）
   ```javascript
   const socket = io('http://localhost:3000', {
     auth: {
       token: 'Bearer <jwt-token>'
     }
   });
   ```

2. **`handshake.headers.authorization`**
   ```javascript
   const socket = io('http://localhost:3000', {
     extraHeaders: {
       Authorization: 'Bearer <jwt-token>'
     }
   });
   ```

### 2.2 サーバー側処理フロー

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Handshake                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. WsJwtAuthGuard が JWT を取得                            │
│     - handshake.auth.token                                  │
│     - handshake.headers.authorization                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. JwtService.verify() で JWT を検証                       │
│     - 既存の JWT_SECRET を使用                              │
│     - 有効期限チェック                                      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      検証成功            │     │      検証失敗            │
│                         │     │                         │
│  client.data.user = {   │     │  WsException を throw   │
│    userId: payload.sub, │     │  → 接続拒否              │
│    email: payload.email │     │                         │
│  }                      │     │                         │
│                         │     │                         │
│  → 接続許可              │     │                         │
└─────────────────────────┘     └─────────────────────────┘
```

### 2.3 認証済みユーザー情報の格納

検証成功時、`client.data.user` に以下の情報を格納:

```typescript
interface WsUser {
  userId: number;
  email: string;
}

// client.data.user としてアクセス可能
```

---

## 3. DB 保存のタイミングと整合性担保

### 3.1 sendMessage 処理フロー

```
┌─────────────────────────────────────────────────────────────┐
│  Client → Server: sendMessage                               │
│  { roomId: 1, content: "Hello!" }                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. client.data.user から userId を取得                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Prisma で messages テーブルに INSERT                    │
│                                                             │
│  prisma.message.create({                                    │
│    data: {                                                  │
│      content: payload.content,                              │
│      userId: user.userId,                                   │
│      chatRoomId: payload.roomId                             │
│    }                                                        │
│  })                                                         │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      保存成功            │     │      保存失敗            │
│                         │     │                         │
│  server.to(roomId)      │     │  client.emit('error', { │
│    .emit('messageCreated',│   │    message: '...'       │
│      { id, roomId, ... })│    │  })                     │
│                         │     │                         │
│  → ルーム全体に配信      │     │  → 送信者のみに通知     │
└─────────────────────────┘     └─────────────────────────┘
```

### 3.2 整合性方針

1. **「DB に保存できなかったメッセージは配信しない」**
   - メッセージは必ず先に DB に保存
   - 保存成功後にのみ `messageCreated` イベントを配信
   - これによりデータの永続性と配信の整合性を担保

2. **エラー時の挙動**
   - DB 保存失敗時は送信者に `error` イベントで通知
   - 他のクライアントには配信しない

3. **将来的な拡張**
   - トランザクションが必要な場合は `prisma.$transaction()` を使用
   - 複数テーブルへの同時書き込みが必要になった際に検討

---

## 4. ルーム管理

### 4.1 joinRoom 処理

1. クライアントから `joinRoom` イベント受信
2. `client.join(roomId.toString())` でルームに参加
3. `roomJoined` イベントで参加完了を通知

### 4.2 leaveRoom 処理

1. クライアントから `leaveRoom` イベント受信
2. `client.leave(roomId.toString())` でルームから退出
3. `roomLeft` イベントで退出完了を通知

### 4.3 ルーム ID の扱い

- DB 上の `chat_rooms.id` は `INT` 型
- Socket.IO のルーム名は文字列のため、`roomId.toString()` で変換
- クライアント側では数値で送信、サーバー側で文字列に変換

---

## 5. CORS 設定

```typescript
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',  // フロントエンド開発環境
      // 本番環境の URL を追加
    ],
    credentials: true,
  },
})
```

---

## 6. クライアント接続例

### 6.1 接続

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: `Bearer ${accessToken}`
  }
});

socket.on('connect', () => {
  console.log('Connected');
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});
```

### 6.2 ルーム参加・退出

```javascript
// 参加
socket.emit('joinRoom', { roomId: 1 });
socket.on('roomJoined', (data) => {
  console.log('Joined room:', data.roomId);
});

// 退出
socket.emit('leaveRoom', { roomId: 1 });
socket.on('roomLeft', (data) => {
  console.log('Left room:', data.roomId);
});
```

### 6.3 メッセージ送受信

```javascript
// 送信
socket.emit('sendMessage', {
  roomId: 1,
  content: 'Hello, World!'
});

// 受信
socket.on('messageCreated', (message) => {
  console.log('New message:', message);
  // { id: 1, roomId: 1, userId: 1, content: 'Hello, World!', createdAt: '...' }
});

// エラー
socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```
