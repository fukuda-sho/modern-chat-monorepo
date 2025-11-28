# Slack-like 機能拡張ロードマップ

## 1. 概要

本ドキュメントは、既存のリアルタイムチャットアプリケーションを Slack ライクなアプリに拡張するための機能ロードマップを定義する。

### 1.1 ユーザー要件サマリ

| 項目 | 方針 |
|------|------|
| スレッド返信 | 実装しない（DMのみ） |
| ファイルアップロード | 今回は不要 |
| メッセージ検索 | 中優先度（Phase 5で実装） |

### 1.2 現状の実装済み機能

- ユーザー認証（ログイン/サインアップ、JWT）
- チャンネル（ルーム）の作成・一覧表示
- リアルタイムメッセージング（Socket.IO）
- 基本的なUI（サイドバー、メッセージリスト、入力フォーム）
- 自動再接続（指数バックオフ）

---

## 2. 追加機能一覧

### 2.1 優先度順機能リスト

| Phase | 機能 | 優先度 | 複雑度 | 想定工数 |
|-------|------|--------|--------|----------|
| 1 | ユーザープレゼンス | 高 | 低 | 2-3日 |
| 1 | タイピングインジケーター | 高 | 低 | 1-2日 |
| 1 | オプティミスティック更新 | 高 | 低 | 1日 |
| 2 | メッセージ編集/削除 | 高 | 低-中 | 2日 |
| 2 | 絵文字リアクション | 中 | 中 | 2-3日 |
| 3 | 未読管理/バッジ | 高 | 中 | 2-3日 |
| 3 | デスクトップ通知 | 中 | 低 | 1日 |
| 4 | ダイレクトメッセージ (DM) | 高 | 中 | 3-4日 |
| 5 | ユーザープロフィール/アバター | 中 | 低 | 2日 |
| 5 | @メンション | 中 | 中 | 2-3日 |
| 5 | メッセージ検索 | 中 | 中 | 2-3日 |

### 2.2 実装フェーズ構成

```
Phase 1 (1-2週間): リアルタイム体験の強化
├── 1.1 ユーザープレゼンス（オンライン/オフライン）
├── 1.2 タイピングインジケーター
└── 1.3 オプティミスティック更新

Phase 2 (1-2週間): メッセージ機能の拡充
├── 2.1 メッセージ編集・削除
└── 2.2 絵文字リアクション

Phase 3 (1-2週間): 未読管理と通知
├── 3.1 未読メッセージカウント
└── 3.2 デスクトップ/サウンド通知

Phase 4 (2週間): ダイレクトメッセージ
└── 4.1 DMサポート

Phase 5 (2-3週間): ユーザー体験の向上
├── 5.1 ユーザープロフィール
├── 5.2 @メンション
└── 5.3 メッセージ検索
```

---

## 3. Phase 別概要

### 3.1 Phase 1: リアルタイム体験の強化

アプリを「生きている」と感じさせる基本的なリアルタイム機能。

| 機能 | 概要 | 主な変更箇所 |
|------|------|-------------|
| ユーザープレゼンス | オンライン/オフライン状態のリアルタイム表示 | Gateway, Frontend Store |
| タイピングインジケーター | 「〇〇さんが入力中...」表示 | Gateway, Frontend Component |
| オプティミスティック更新 | メッセージ送信の即時反映 | Frontend のみ |

**詳細仕様**: `docs/10_implementation/backend/10_realtime-presence.md`, `docs/10_implementation/frontend/11_realtime-presence.md`

### 3.2 Phase 2: メッセージ機能の拡充

メッセージの編集・削除・リアクション機能。

| 機能 | 概要 | 主な変更箇所 |
|------|------|-------------|
| メッセージ編集/削除 | 自分のメッセージの編集・ソフトデリート | Schema, Gateway, Frontend |
| 絵文字リアクション | メッセージへの絵文字リアクション | Schema, Gateway, Frontend |

**詳細仕様**: `docs/10_implementation/backend/12_message-actions.md`, `docs/10_implementation/frontend/14_message-actions.md`

### 3.3 Phase 3: 未読管理と通知

ユーザーエンゲージメントを高める通知機能。

| 機能 | 概要 | 主な変更箇所 |
|------|------|-------------|
| 未読メッセージカウント | サイドバーに未読バッジ表示 | Schema, API, Frontend |
| デスクトップ/サウンド通知 | ブラウザ通知・通知音 | Frontend のみ |

**詳細仕様**: `docs/10_implementation/backend/13_unread-management.md`, `docs/10_implementation/frontend/15_notifications.md`

### 3.4 Phase 4: ダイレクトメッセージ

1対1のプライベートチャット機能。

| 機能 | 概要 | 主な変更箇所 |
|------|------|-------------|
| DMサポート | 1対1のダイレクトメッセージ | Schema, New Module, Frontend |

**詳細仕様**: `docs/10_implementation/backend/14_direct-messages.md`, `docs/10_implementation/frontend/16_direct-messages.md`

### 3.5 Phase 5: ユーザー体験の向上

プロフィール、メンション、検索機能。

| 機能 | 概要 | 主な変更箇所 |
|------|------|-------------|
| ユーザープロフィール | 表示名・アバター・自己紹介 | Schema, API, Frontend |
| @メンション | @ユーザー名でのメンション | Schema, Gateway, Frontend |
| メッセージ検索 | キーワードでのメッセージ検索 | New Module, Frontend |

**詳細仕様**: `docs/10_implementation/backend/15_user-profile.md`, `docs/10_implementation/frontend/17_user-profile.md`

---

## 4. 技術的変更サマリ

### 4.1 データベーススキーマ追加

```prisma
// Phase 2: リアクション
model Reaction {
  id        Int      @id @default(autoincrement())
  emoji     String   @db.VarChar(50)
  userId    Int      @map("user_id")
  messageId Int      @map("message_id")
  createdAt DateTime @default(now())

  @@unique([userId, messageId, emoji])
  @@map("reactions")
}

// Phase 3: ルームメンバーシップ（未読管理）
model RoomMember {
  id                Int       @id @default(autoincrement())
  userId            Int       @map("user_id")
  chatRoomId        Int       @map("chat_room_id")
  role              RoomRole  @default(MEMBER)
  lastReadAt        DateTime?
  lastReadMessageId Int?

  @@unique([userId, chatRoomId])
  @@map("room_members")
}

// Phase 4: ルームタイプ（DM対応）
enum RoomType {
  CHANNEL
  PRIVATE
  DM
}

// Phase 5: メンション
model Mention {
  id        Int @id @default(autoincrement())
  messageId Int @map("message_id")
  userId    Int @map("user_id")

  @@unique([messageId, userId])
  @@map("mentions")
}
```

### 4.2 既存モデルの拡張

```prisma
model User {
  // 追加フィールド (Phase 5)
  displayName String?   @map("display_name")
  avatarUrl   String?   @map("avatar_url")
  statusText  String?   @map("status_text")
  bio         String?
}

model Message {
  // 追加フィールド (Phase 2)
  isEdited  Boolean   @default(false)
  editedAt  DateTime?
  isDeleted Boolean   @default(false)
  deletedAt DateTime?
}

model ChatRoom {
  // 追加フィールド (Phase 4)
  type        RoomType @default(CHANNEL)
  description String?
}
```

### 4.3 WebSocket イベント追加

| Phase | Direction | Event | 用途 |
|-------|-----------|-------|------|
| 1 | S->C | `userOnline` | プレゼンス: オンライン |
| 1 | S->C | `userOffline` | プレゼンス: オフライン |
| 1 | C->S | `startTyping` | タイピング開始 |
| 1 | C->S | `stopTyping` | タイピング終了 |
| 1 | S->C | `userTyping` | タイピング状態通知 |
| 2 | C->S | `editMessage` | メッセージ編集 |
| 2 | C->S | `deleteMessage` | メッセージ削除 |
| 2 | S->C | `messageUpdated` | 編集通知 |
| 2 | S->C | `messageDeleted` | 削除通知 |
| 2 | C->S | `addReaction` | リアクション追加 |
| 2 | C->S | `removeReaction` | リアクション削除 |
| 2 | S->C | `reactionAdded` | リアクション追加通知 |
| 2 | S->C | `reactionRemoved` | リアクション削除通知 |
| 5 | S->C | `mentioned` | メンション通知 |

### 4.4 REST API 追加

| Phase | Method | Path | 用途 |
|-------|--------|------|------|
| 3 | GET | `/chat-rooms/unread` | 未読数一覧 |
| 3 | POST | `/chat-rooms/:id/read` | 既読更新 |
| 4 | GET | `/dms` | DM一覧 |
| 4 | POST | `/dms` | DM作成/取得 |
| 4 | GET | `/users/search` | ユーザー検索 |
| 5 | GET | `/users/me/profile` | 自プロフィール取得 |
| 5 | PATCH | `/users/me/profile` | プロフィール更新 |
| 5 | GET | `/users/:id/profile` | 他ユーザープロフィール |
| 5 | GET | `/messages/search` | メッセージ検索 |

---

## 5. フロントエンド構成追加

### 5.1 新規 Store

```
frontend/features/
├── presence/
│   └── store/
│       └── presence-store.ts    # Phase 1: プレゼンス・タイピング状態
├── user/
│   └── store/
│       └── user-store.ts        # Phase 5: ユーザー設定
└── search/
    └── store/
        └── search-store.ts      # Phase 5: 検索状態
```

### 5.2 新規コンポーネント

| Phase | パス | 用途 |
|-------|------|------|
| 1 | `components/ui/presence-indicator.tsx` | プレゼンスドット |
| 1 | `features/chat/components/typing-indicator.tsx` | タイピング表示 |
| 2 | `features/chat/components/message-actions.tsx` | 編集/削除ボタン |
| 2 | `features/chat/components/message-edit-form.tsx` | 編集フォーム |
| 2 | `features/chat/components/reaction-bar.tsx` | リアクション表示 |
| 2 | `features/chat/components/emoji-picker-button.tsx` | 絵文字ピッカー |
| 3 | `features/settings/components/notification-settings.tsx` | 通知設定 |
| 4 | `features/chat/components/dm-list.tsx` | DM一覧 |
| 4 | `features/chat/components/dm-item.tsx` | DMアイテム |
| 4 | `features/chat/components/new-dm-dialog.tsx` | DM作成ダイアログ |
| 5 | `features/user/components/profile-form.tsx` | プロフィール編集 |
| 5 | `features/user/components/user-popover.tsx` | ユーザーカード |
| 5 | `features/chat/components/mention-autocomplete.tsx` | メンション補完 |
| 5 | `features/search/components/search-dialog.tsx` | 検索ダイアログ |

### 5.3 新規サービス

| Phase | パス | 用途 |
|-------|------|------|
| 3 | `lib/notification-service.ts` | 通知管理 |

---

## 6. 追加ライブラリ

| ライブラリ | バージョン | 用途 | Phase |
|-----------|-----------|------|-------|
| `@emoji-mart/react` | latest | 絵文字ピッカー | 2 |
| `@emoji-mart/data` | latest | 絵文字データ | 2 |

---

## 7. 想定工数

| Phase | 内容 | 工数 |
|-------|------|------|
| Phase 1 | リアルタイム体験の強化 | 1-2週間 |
| Phase 2 | メッセージ機能の拡充 | 1-2週間 |
| Phase 3 | 未読管理と通知 | 1-2週間 |
| Phase 4 | ダイレクトメッセージ | 2週間 |
| Phase 5 | ユーザー体験の向上 | 2-3週間 |
| **合計** | | **7-11週間** |

---

## 8. 関連ドキュメント

### 8.1 詳細仕様書（作成予定）

**Backend**
- `docs/10_implementation/backend/10_realtime-presence.md`
- `docs/10_implementation/backend/12_message-actions.md`
- `docs/10_implementation/backend/13_unread-management.md`
- `docs/10_implementation/backend/14_direct-messages.md`
- `docs/10_implementation/backend/15_user-profile.md`
- `docs/10_implementation/backend/16_mentions.md`
- `docs/10_implementation/backend/17_message-search.md`

**Frontend**
- `docs/10_implementation/frontend/11_realtime-presence.md`
- `docs/10_implementation/frontend/14_message-actions.md`
- `docs/10_implementation/frontend/15_notifications.md`
- `docs/10_implementation/frontend/16_direct-messages.md`
- `docs/10_implementation/frontend/17_user-profile.md`
- `docs/10_implementation/frontend/18_mentions.md`
- `docs/10_implementation/frontend/19_message-search.md`

### 8.2 既存ドキュメント

- `docs/00_planning/database.md` - 現行DBスキーマ
- `docs/10_implementation/backend/02_chat_gateway.md` - WebSocket仕様
- `docs/10_implementation/frontend/04_websocket-integration.md` - Socket.IO統合

---

## 9. 次のステップ

1. Phase 1 の詳細仕様書を作成
2. データベースマイグレーション計画の策定
3. Phase 1 の実装開始
