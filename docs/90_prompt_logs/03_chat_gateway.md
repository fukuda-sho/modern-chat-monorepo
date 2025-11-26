# 作業ログ: WebSocket Chat Gateway 実装

## 作業日

2025-11-26（設計方針ドキュメント追記）
2025-11-25（初回実装）

---

## 実施した作業の概要

### 1. WebSocket 仕様ドキュメント作成

**ファイル**: `docs/10_implementation/backend/02_chat_gateway.md`

- WebSocket イベント名リスト（Client → Server / Server → Client）
- 接続時の認証フロー（JWT 検証シーケンス図）
- DB 保存のタイミングと整合性担保方針
- ルーム管理（joinRoom / leaveRoom）の処理フロー
- CORS 設定とクライアント接続例

### 2. Socket.IO パッケージのインストール

```bash
yarn add @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### 3. Chat 型定義の実装

**ファイル**: `src/chat/types/chat.types.ts`

- `WsUser`: WebSocket 接続時に格納されるユーザー情報
- `JoinRoomPayload` / `LeaveRoomPayload`: ルーム参加・退出ペイロード
- `SendMessagePayload`: メッセージ送信ペイロード
- `MessageCreatedPayload`: 新規メッセージ通知ペイロード
- `RoomJoinedPayload` / `RoomLeftPayload`: ルーム参加・退出完了通知
- `ErrorPayload`: エラー通知ペイロード

### 4. WsJwtAuthGuard の実装

**ファイル**: `src/chat/guards/ws-jwt-auth.guard.ts`

- WebSocket ハンドシェイク時の JWT 検証
- トークン取得優先順位:
  1. `handshake.auth.token`（推奨）
  2. `handshake.headers.authorization`
  3. `handshake.query.token`（フォールバック）
- 検証成功時に `client.data.user` へユーザー情報を格納
- 検証失敗時は `WsException` をスロー

### 5. ChatGateway の実装

**ファイル**: `src/chat/chat.gateway.ts`

- `@WebSocketGateway` デコレータで WebSocket Gateway を定義
- CORS 設定（`http://localhost:3000` を許可）
- `@UseGuards(WsJwtAuthGuard)` で全イベントに認証を適用
- 実装したイベントハンドラ:
  - `handleConnection`: クライアント接続時のログ出力
  - `handleDisconnect`: クライアント切断時のログ出力
  - `handleJoinRoom`: ルーム参加処理
  - `handleLeaveRoom`: ルーム退出処理
  - `handleSendMessage`: メッセージ送信・DB保存・ブロードキャスト

### 6. ChatModule の実装

**ファイル**: `src/chat/chat.module.ts`

- `JwtModule.register()` で JWT 設定を登録
- `ChatGateway` と `WsJwtAuthGuard` をプロバイダとして登録

### 7. AppModule への統合

**ファイル**: `src/app.module.ts`

- `ChatModule` を imports 配列に追加

---

## 重要な設計・仕様上の決定事項

### ChatRoom 単位の設計方針

- すべてのチャットは **「ChatRoom 単位」** で扱う
- WebSocket イベントは `roomId` をキーとした汎用インターフェース
- 1対1チャット / グループチャットの区別は現時点では未実装
- 将来的に `ChatRoom.type` フィールド（`'DIRECT' | 'GROUP'`）で種別管理を予定
- 将来的に `ChatRoomMember` テーブルでルーム参加権限を管理予定
- 現在の WebSocket イベントは将来の拡張後も互換性を維持

### WebSocket イベント一覧

| 方向 | イベント名 | 目的 |
|------|-----------|------|
| C→S | `joinRoom` | ルーム参加 |
| C→S | `leaveRoom` | ルーム退出 |
| C→S | `sendMessage` | メッセージ送信 |
| S→C | `roomJoined` | ルーム参加完了通知 |
| S→C | `roomLeft` | ルーム退出完了通知 |
| S→C | `messageCreated` | 新規メッセージ通知 |
| S→C | `error` | エラー通知 |

### 整合性方針

- **「DB に保存できなかったメッセージは配信しない」**
- メッセージは必ず先に DB に保存
- 保存成功後にのみ `messageCreated` イベントを配信
- DB 保存失敗時は送信者のみに `error` イベントで通知

### 認証済みユーザー情報

```typescript
interface WsUser {
  userId: number;
  email: string;
}

// client.data.user としてアクセス可能
```

---

## 作成ファイル一覧

```
backend/src/chat/
├── types/
│   └── chat.types.ts       # WebSocket イベント型定義
├── guards/
│   └── ws-jwt-auth.guard.ts # WebSocket JWT 認証ガード
├── chat.gateway.ts          # WebSocket Gateway
└── chat.module.ts           # Chat モジュール
```

---

## 使用ライブラリ

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| @nestjs/websockets | ^11.0.20 | NestJS WebSocket サポート |
| @nestjs/platform-socket.io | ^11.0.20 | Socket.IO アダプター |
| socket.io | ^4.8.1 | WebSocket ライブラリ |

---

## 今後の拡張余地

### 1. 1対1 / グループチャット機能

- `ChatRoom` に `type` フィールドを追加（`'DIRECT' | 'GROUP'`）
- `ChatRoomMember` テーブルでルームメンバーシップを管理
- 1対1チャットは既存ルームの再利用ロジックを実装

### 2. 既読管理

- `MessageRead` テーブルの追加（`messageId`, `userId`, `readAt`）
- `markAsRead` イベントの追加
- 既読数・未読数の通知

### 3. メッセージ編集・削除

- `editMessage` / `deleteMessage` イベントの追加
- `Message` に `updatedAt`, `deletedAt` フィールドを追加
- `messageUpdated` / `messageDeleted` 通知イベント

### 4. タイピングインジケーター

- `typing` / `stopTyping` イベントの追加
- ルーム内の他ユーザーに「入力中」を通知

### 5. オンラインステータス

- 接続中ユーザーの管理
- `userOnline` / `userOffline` イベント

---

## 次のステップ

1. **フロントエンドの WebSocket クライアント実装**
2. **WebSocket 接続テスト**:
   ```javascript
   const socket = io('http://localhost:3001', {
     auth: { token: `Bearer ${accessToken}` }
   });

   socket.emit('joinRoom', { roomId: 1 });
   socket.emit('sendMessage', { roomId: 1, content: 'Hello!' });
   ```
3. **ルーム作成・管理 API の実装**（必要に応じて）
