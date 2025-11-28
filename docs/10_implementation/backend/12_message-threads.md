# メッセージスレッド（Slack ライク） Backend 仕様

## 1. 概要

| 項目 | 内容 |
|------|------|
| フェーズ | Phase 3（Slack-like メッセージ/スレッド UI） |
| 対象 | Backend（NestJS / Prisma / Socket.IO） |
| 目的 | 親メッセージに紐づくスレッド返信と、左寄せリスト用のスレッドメタ情報を提供する |

### 1.1 変更対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `backend/prisma/schema.prisma` | `Message` にスレッド関連カラム/リレーション追加 |
| `backend/src/chat/dto/message.dto.ts` | `parentMessageId` / スレッド集計フィールドをレスポンスに追加 |
| `backend/src/chat/dto/get-thread.dto.ts` | スレッド取得用 DTO 新規 |
| `backend/src/chat/chat.service.ts` | スレッド取得/返信作成/集計更新ロジック追加、タイムラインは親メッセージのみ返す |
| `backend/src/chat/chat.controller.ts` | `/chat/messages/:id/thread` GET/POST 追加 |
| `backend/src/chat/chat.gateway.ts` | `createThreadReply` ハンドラと thread イベント配信追加 |
| `backend/src/chat/types/chat.types.ts` | thread 系ペイロード/イベント名追加 |
| `backend/src/chat/chat.service.spec.ts` | スレッド関連の単体テスト追加 |

---

## 2. スキーマ変更（Prisma）

- `Message`
  - `parentMessageId Int?`
  - `threadReplyCount Int @default(0)`
  - `threadLastRepliedAt DateTime?`
  - `threadLastRepliedBy Int?`（返信者追跡）
  - リレーション:
    - `parentMessage` (self relation)
    - `threadReplies` (self relation)
    - `threadLastRepliedByUser` (User)
  - インデックス: `@@index([parentMessageId, createdAt])`
- 互換: 既存メッセージは `parentMessageId = null`、`threadReplyCount = 0`。

---

## 3. REST API

### 3.1 スレッド取得
- `GET /chat/messages/:id/thread`
- レスポンス: `{ parent: MessageDto; replies: MessageDto[]; pagination }`
  - 親メッセージは `parentMessageId = null` 前提で取得
  - ページネーション: `limit` (default 30), `cursor` (reply id), `direction` (`older`/`newer`)

### 3.2 スレッド返信作成
- `POST /chat/messages/:id/thread`
- Body: `{ content: string }`
- 動作:
  - 親メッセージ存在確認・アクセス権チェック
  - 同じ `chatRoomId` で子メッセージ作成（`parentMessageId = :id`）
  - 親の `threadReplyCount`/`threadLastRepliedAt`/`threadLastRepliedBy` を更新
- レスポンス: 作成した返信メッセージ（MessageDto 相当）

### 3.3 タイムライン挙動
- `GET /chat/rooms/:roomId/messages` は `parentMessageId IS NULL` のみ返す。
- `MessageDto` にスレッド集計フィールドを追加して、返信数/最終返信をクライアントへ伝える。

---

## 4. WebSocket

### 4.1 追加イベント

| Direction | Event | Payload | 用途 |
|-----------|-------|---------|------|
| C→S | `createThreadReply` | `{ parentMessageId, content, localId? }` | スレッド返信の作成 |
| S→C | `threadReplyAdded` | `{ parentMessageId, reply: MessagePayload }` | スレッド返信の新規配信 |
| S→C | `threadReplyUpdated` | `{ parentMessageId, replyId, content, isEdited, editedAt }` | 返信の編集 |
| S→C | `threadReplyDeleted` | `{ parentMessageId, replyId }` | 返信の削除 |
| S→C | `threadSummaryUpdated` | `{ parentMessageId, threadReplyCount, threadLastRepliedAt, threadLastRepliedBy }` | 親メッセージの集計更新 |

### 4.2 配信先ポリシー
- すべて親メッセージの所属ルームに broadcast（スレッドペインを開いていないユーザーも集計更新を受信）。
- 返信作成時に `threadSummaryUpdated` をセットで送信する。

---

## 5. サービスロジック

1. **タイムライン取得**: `parentMessageId IS NULL` で取得。`MessageDto` に `threadReplyCount`/`threadLastRepliedAt`/`threadLastRepliedBy` を含める。
2. **スレッド取得**: 親の存在確認 → アクセス権確認 → 返信をページネーションで取得。削除済みは本文空文字で返す。
3. **返信作成**: 親を検証し、同一 `chatRoomId` で作成。トランザクションで集計カラムをインクリメント & 最終返信更新。
4. **返信編集/削除（WSイベントのみ）**: 既存の `editMessage`/`deleteMessage` と共通バリデーションを流用し、`threadReplyUpdated`/`threadReplyDeleted` を配信。

---

## 6. テスト方針

- `chat.service.spec.ts`
  - タイムラインが親メッセージのみ返すこと
  - スレッド取得: 親不存在/権限なしの例外、ページネーションのカーソル挙動
  - 返信作成: 親の集計カラム更新が行われること
- E2E（別途）: WS 経由で `createThreadReply` → `threadReplyAdded`/`threadSummaryUpdated` を受け取れること（後続で追加）。

---

## 7. 移行/互換

- 既存メッセージは自動的に `parentMessageId = null` で移行可。
- 旧クライアントは新規 WS イベントを無視しても破綻しないよう、`messageCreated` のペイロードは従来通り（スレッド返信は `threadReplyAdded` のみで配信）。
