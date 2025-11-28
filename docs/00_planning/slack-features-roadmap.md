# Slack-like 機能拡張ロードマップ

## 1. 概要

本ドキュメントは、既存のリアルタイムチャットアプリケーションを Slack ライクなアプリに拡張するための機能ロードマップを定義する。

### 1.1 ユーザー要件サマリ

| 項目 | 方針 |
|------|------|
| スレッド返信 | Slackライクにスレッド/コメントをサポート（Phase 3で導入） |
| ファイルアップロード | 今回は不要 |
| メッセージ検索 | 中優先度（Phase 6で実装） |

### 1.2 現状の実装済み機能

- ユーザー認証（ログイン/サインアップ、JWT）
- チャンネル（ルーム）の作成・一覧表示
- リアルタイムメッセージング（Socket.IO）
- 基本的なUI（サイドバー、メッセージリスト、入力フォーム）
- 自動再接続（指数バックオフ）
- メッセージ編集・削除（ソフトデリート、編集フラグ表示）
- 絵文字リアクション（追加/削除、メッセージ単位の集計表示）

### 1.3 フェーズ進捗

| Phase | 状態 | メモ |
|-------|------|------|
| Phase 1: リアルタイム体験の強化 | ✅ 完了 | プレゼンス/タイピング/オプティミスティック更新導入済み |
| Phase 2: メッセージ機能の拡充 | ✅ 完了 | 編集・削除・リアクションを実装済み（UIは更に磨き込み予定） |
| Phase 3: Slackライクなメッセージ/スレッドUI | ⏳ 着手前 | 左寄せリスト + スレッドパネル/返信数表示。モデル/WS/API/UXをSlack準拠で設計 |
| Phase 4: 未読管理と通知 | ⏳ 着手前 | SlackライクUI転換と合わせて未読/通知を導入 |
| Phase 5: ダイレクトメッセージ | ⏳ 着手前 | ナビゲーションとDM UXの再設計を含めて実施 |
| Phase 6: ユーザー体験の向上 | ⏳ 着手前 | グローバル検索/プロフィール/メンションをSlackライクに統合 |

---

## 2. 追加機能一覧

### 2.1 優先度順機能リスト

| Phase | 機能 | 優先度 | 複雑度 | 想定工数 | 状態 |
|-------|------|--------|--------|----------|------|
| 1 | ユーザープレゼンス | 高 | 低 | 2-3日 | ✅ 完了 |
| 1 | タイピングインジケーター | 高 | 低 | 1-2日 | ✅ 完了 |
| 1 | オプティミスティック更新 | 高 | 低 | 1日 | ✅ 完了 |
| 2 | メッセージ編集/削除 | 高 | 低-中 | 2日 | ✅ 完了 |
| 2 | 絵文字リアクション | 中 | 中 | 2-3日 | ✅ 完了 |
| 3 | Slack-like メッセージレイアウト統一（左寄せ/セルUI） | 高 | 中 | 2-3日 | ⏳ 着手前 |
| 3 | スレッド（返信）モデル/UX（Slack準拠） | 高 | 中-高 | 3-4日 | ⏳ 着手前 |
| 4 | 未読管理/バッジ | 高 | 中 | 2-3日 | ⏳ 着手前 |
| 4 | デスクトップ通知 | 中 | 低 | 1日 | ⏳ 着手前 |
| 5 | ダイレクトメッセージ (DM) | 高 | 中 | 3-4日 | ⏳ 着手前 |
| 6 | ユーザープロフィール/アバター | 中 | 低 | 2日 | ⏳ 着手前 |
| 6 | @メンション | 中 | 中 | 2-3日 | ⏳ 着手前 |
| 6 | メッセージ検索 | 中 | 中 | 2-3日 | ⏳ 着手前 |

### 2.2 実装フェーズ構成

```
Phase 1 (1-2週間): リアルタイム体験の強化
├── 1.1 ユーザープレゼンス（オンライン/オフライン）
├── 1.2 タイピングインジケーター
└── 1.3 オプティミスティック更新

Phase 2 (1-2週間): メッセージ機能の拡充
├── 2.1 メッセージ編集・削除
└── 2.2 絵文字リアクション

Phase 3 (1-2週間): Slack-like メッセージ/スレッドUI
├── 3.1 左寄せリスト/メッセージセルの統一
├── 3.2 スレッドモデルと右ペイン返信UI
└── 3.3 親メッセージへの返信数/最新返信サマリ表示

Phase 4 (1-2週間): 未読管理と通知
├── 4.1 未読メッセージカウント
└── 4.2 デスクトップ/サウンド通知

Phase 5 (2週間): ダイレクトメッセージ
└── 5.1 DMサポート

Phase 6 (2-3週間): ユーザー体験の向上
├── 6.1 ユーザープロフィール
├── 6.2 @メンション
└── 6.3 メッセージ検索
```

---

## 3. Phase 別概要

### 3.0 SlackライクUI強化方針（Phase 3-6）

- 全体方針: 3カラム構成（左: ワークスペース/チャンネル/DM、中央: メッセージ、右: 補助パネル）、濃淡を使ったチャンネル階層表示、ホバー時にアクションが出るメッセージセル、キーボードファースト操作（Cmd/Ctrl+K, @補完, ショートカットヘルプ）。
- ビジュアル: テーマトークンを導入して Slack ライクな濃色サイドバー + 明るいメインペインを再現しつつ、ブランドカラーをサブアクセントに限定する。
- 情報設計: 「チャンネル → 未読優先 → DM → ボット/アプリ」という並びで整理し、未読/メンションを即座に把握できるようバッジとサウンド/デスクトップ通知を組み合わせる。
- スコープ明確化: メッセージ/スレッドの左寄せリスト + 右ペインでのスレッド閲覧をSlack準拠で実装し、メッセージアクション（編集/削除/リアクション/返信）をホバーUIでまとめる。

| トピック | 目的 | Phase | 主なアクション | 依存 |
|----------|------|-------|----------------|------|
| サイドバー/IA刷新 | チャンネル/DMの視認性と未読検知を向上 | 4 | グルーピング、未読バッジ、並び替え、クイックフィルタ | 未読管理 |
| メッセージリストUI | Slack ライクな密度とホバー操作 | 3 | コンパクト/デンス切替、ホバー時のツールバー、日付区切り | 既存メッセージ機能 |
| 通知体験 | 気づきやすさの向上 | 4 | 通知設定UI、音/デスクトップ通知、ドット/数値バッジ | 通知API |
| DM UX | DM開始と会話切替を軽量化 | 5 | DMセクション強調、アバター付きリスト、New DMダイアログ | DM実装 |
| グローバル検索/スイッチャー | Slack風の Cmd/Ctrl+K & 検索 | 6 | クイックスイッチャー、検索ダイアログ、結果のジャンプ | 検索API/メンション |

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

### 3.3 Phase 3: Slack-like メッセージ/スレッド UI

Slackに寄せたメッセージ行/スレッド体験を実装するフェーズ。左右分割の吹き出しUIを廃止し、左寄せのメッセージリスト + 右ペインのスレッド表示を導入する。

#### 3.3.1 Slack-like Message & Thread Model

- 現状課題: 自分=右/相手=左の吹き出しUIで、親メッセージとコメントの構造が弱い（スレッド返信なし）。
- ゴール: すべてのメッセージを左寄せで縦に並べ、各メッセージがスレッドの親になり、右ペインでスレッドを閲覧・返信できるSlack準拠の体験を実現。

| 観点 | 方針 (Slackの挙動をできるだけ忠実に模倣) |
|------|----------------------------------------|
| データモデル | `Message.parentMessageId` を追加し、親=タイムラインのメッセージ、子=スレッド内メッセージとして紐付け。親に `threadReplyCount`, `threadLastRepliedAt`, `threadLastRepliedBy` を持たせて一覧用の集約を高速化。 |
| API/WS | REST: `GET /messages/:id/thread`（親とスレッドメッセージ取得）, `POST /messages/:id/thread`（返信作成）。WS: `threadReplyAdded`, `threadReplyUpdated`, `threadReplyDeleted`, `threadSummaryUpdated` を追加し、親の返信数/最新返信を即時反映。 |
| 互換/移行 | 既存メッセージは `parentMessageId = null` で移行。古いクライアントは新しいWSイベントを無視しても破綻しないよう既存 `messageCreated` に親ID/メタを含める。 |
| UI/UX | 親メッセージ行に「返信◯件・最終返信時刻/送信者」を表示。右ペインにスレッドを開き、メッセージへのホバーアクションに「スレッドを開く」を追加。 |
| テスト | Backend: 親子整合性/集計更新/WSイベント。Frontend: メッセージ行表示、スレッドペイン開閉、返信投稿と同期、アクセシビリティ（フォーカス/ショートカット）。 |

#### 3.3.2 Slack-like Message Layout

- 左寄せリストで統一: 自分/相手に関わらず同一カラムに縦並び。吹き出し装飾を廃止し、フラットなセルUIへ移行。
- 差別化手段: 自分のメッセージは背景の微配色・アバター枠・「You」チップで区別。アバター/名前/タイムスタンプを1行化し、Slack風の行レイアウトにする。
- ホバーアクション: 編集/削除/リアクション/スレッドを1つのホバー-toolbarに集約。
- 右ペインのスレッド: 親のプレビューをヘッダーに表示し、スレッド返信は時系列で表示。返信フォームはペイン下部に固定。

#### 3.3.3 実装ステップ（小さく切る、Slack準拠）

1) **Schema/Index**: `parentMessageId`、スレッド集計フィールドを追加しマイグレーション。親メッセージ取得時に子を引かないで済むよう集計カラムを更新トリガで維持。  
2) **Gateway/WS**: `messageCreated` に `parentMessageId`/スレッドメタを含める。`threadReplyAdded/Updated/Deleted/ SummaryUpdated` を追加し、親行を部分更新する。  
3) **REST**: `/messages/:id/thread` GET/POST を追加し、ページネーションと既読/未読の境界を返す。  
4) **Message Layout**: 左寄せセルUIに差し替え（アバター左、本文右）。自分メッセージのスタイル差別化をトークン化。  
5) **Thread UX**: 親行に「返信◯件」リンク + 最終返信サマリ。クリックで右ペインを開き、返信作成/編集/削除/リアクションをサポート。  
6) **アクセシビリティ/ショートカット**: `Cmd/Ctrl+Shift+Enter` でスレッド返信、`Esc` でペインを閉じる。  
7) **QA/テスト**: 親子整合性・WS同期・レイアウト回りのビジュアル回帰（スクショテスト）・キーボード操作のE2E。

**詳細仕様（作成予定）**: `docs/10_implementation/backend/12_message-threads.md`, `docs/10_implementation/frontend/14_message-threads.md`

### 3.4 Phase 4: 未読管理と通知

ユーザーエンゲージメントを高める通知機能。

| 機能 | 概要 | 主な変更箇所 |
|------|------|-------------|
| 未読メッセージカウント | サイドバーに未読バッジ表示 | Schema, API, Frontend |
| デスクトップ/サウンド通知 | ブラウザ通知・通知音 | Frontend のみ |

**SlackライクUI適用ポイント**
- サイドバー: 未読バッジとメンションハイライトを優先表示。チャンネル/DMをグルーピングし、未読ありを上位に並べ替え。
- メッセージリスト: ホバーでアクションツールバー（編集/削除/リアクション/スレッド）を表示し、日付区切りと新着ラインを追加して視覚的な未読境界を明確化。
- ヘッダー: 現在のチャンネル名 + メンバー数 + 通知トグルを配置し、通知状態を一目で確認可能にする。

**詳細仕様**: `docs/10_implementation/backend/13_unread-management.md`, `docs/10_implementation/frontend/15_notifications.md`

### 3.5 Phase 5: ダイレクトメッセージ

1対1のプライベートチャット機能。

| 機能 | 概要 | 主な変更箇所 |
|------|------|-------------|
| DMサポート | 1対1のダイレクトメッセージ | Schema, New Module, Frontend |

**SlackライクUI適用ポイント**
- サイドバー: DMセクションを独立表示し、ステータスドット付きアバターを並べる。未読DMは上部にピン留め。
- ナビゲーション: Cmd/Ctrl+K で DM へジャンプできるクイックスイッチャーを用意し、最近使ったDMを優先表示。
- 作成動線: 「新しいDM」ボタンをサイドバー上部に配置し、モーダルで複数ユーザー候補から選択できる。

**詳細仕様**: `docs/10_implementation/backend/14_direct-messages.md`, `docs/10_implementation/frontend/16_direct-messages.md`

### 3.6 Phase 6: ユーザー体験の向上

プロフィール、メンション、検索機能。

| 機能 | 概要 | 主な変更箇所 |
|------|------|-------------|
| ユーザープロフィール | 表示名・アバター・自己紹介 | Schema, API, Frontend |
| @メンション | @ユーザー名でのメンション | Schema, Gateway, Frontend |
| メッセージ検索 | キーワードでのメッセージ検索 | New Module, Frontend |

**SlackライクUI適用ポイント**
- ヘッダー/ショートカット: Cmd/Ctrl+K を呼び出すクイックスイッチャー兼検索ダイアログを提供し、チャンネル/DM/メッセージに素早くジャンプ。
- メッセージ: メンションは色付きチップ＋左サイドバーの@バッジで可視化。検索結果は右ペインでプレビューし、該当メッセージへスクロールジャンプ。
- プロフィール: ユーザーポップオーバーにアバター・ステータス・ショートアクション（DM開始/@メンション）をまとめ、Slackのユーザーカード操作感に寄せる。

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

// Phase 4: ルームメンバーシップ（未読管理）
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

// Phase 5: ルームタイプ（DM対応）
enum RoomType {
  CHANNEL
  PRIVATE
  DM
}

// Phase 6: メンション
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
  // 追加フィールド (Phase 6)
  displayName String?   @map("display_name")
  avatarUrl   String?   @map("avatar_url")
  statusText  String?   @map("status_text")
  bio         String?
}

model Message {
  // スレッド (Phase 3)
  parentMessageId     Int?      @map("parent_message_id")
  threadReplyCount    Int       @default(0) @map("thread_reply_count")
  threadLastRepliedAt DateTime? @map("thread_last_replied_at")
  threadLastRepliedBy Int?      @map("thread_last_replied_by")

  // 追加フィールド (Phase 2)
  isEdited  Boolean   @default(false)
  editedAt  DateTime?
  isDeleted Boolean   @default(false)
  deletedAt DateTime?

  @@index([parentMessageId, createdAt])
}

model ChatRoom {
  // 追加フィールド (Phase 5)
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
| 3 | C->S | `createThreadReply` | スレッド返信の作成 |
| 3 | S->C | `threadReplyAdded` | スレッド返信追加通知 |
| 3 | S->C | `threadReplyUpdated` | スレッド返信編集通知 |
| 3 | S->C | `threadReplyDeleted` | スレッド返信削除通知 |
| 3 | S->C | `threadSummaryUpdated` | 親メッセージの返信数/最新返信更新 |
| 6 | S->C | `mentioned` | メンション通知 |

### 4.4 REST API 追加

| Phase | Method | Path | 用途 |
|-------|--------|------|------|
| 3 | GET | `/messages/:id/thread` | 親メッセージ + スレッドメッセージ取得 |
| 3 | POST | `/messages/:id/thread` | スレッド返信作成 |
| 4 | GET | `/chat-rooms/unread` | 未読数一覧 |
| 4 | POST | `/chat-rooms/:id/read` | 既読更新 |
| 5 | GET | `/dms` | DM一覧 |
| 5 | POST | `/dms` | DM作成/取得 |
| 5 | GET | `/users/search` | ユーザー検索 |
| 6 | GET | `/users/me/profile` | 自プロフィール取得 |
| 6 | PATCH | `/users/me/profile` | プロフィール更新 |
| 6 | GET | `/users/:id/profile` | 他ユーザープロフィール |
| 6 | GET | `/messages/search` | メッセージ検索 |

---

## 5. フロントエンド構成追加

### 5.1 新規 Store

```
frontend/features/
├── presence/
│   └── store/
│       └── presence-store.ts    # Phase 1: プレゼンス・タイピング状態
├── ui/
│   └── store/
│       └── ui-preferences-store.ts # Phase 3: テーマ/密度/サイドバー状態/ショートカット
├── user/
│   └── store/
│       └── user-store.ts        # Phase 6: ユーザー設定
└── search/
    └── store/
        └── search-store.ts      # Phase 6: 検索状態
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
| 3 | `features/chat/components/message-cell.tsx` | 左寄せのメッセージ行UI（Slack準拠） |
| 3 | `features/chat/components/message-hover-toolbar.tsx` | メッセージホバー時の編集/削除/リアクション/スレッドまとめ |
| 3 | `features/chat/components/thread-pane.tsx` | 右ペインのスレッド表示/ヘッダー |
| 3 | `features/chat/components/thread-reply-input.tsx` | スレッド返信フォーム |
| 3 | `features/chat/components/thread-reply-list.tsx` | スレッド内メッセージリスト |
| 4 | `features/layout/components/workspace-sidebar.tsx` | Slack風の濃色サイドバー/グルーピング/未読バッジ |
| 4 | `features/chat/components/unread-separator.tsx` | 未読境界ラインと「新着」ピル |
| 4 | `features/settings/components/notification-settings.tsx` | 通知設定 |
| 5 | `features/chat/components/dm-list.tsx` | DM一覧 |
| 5 | `features/chat/components/dm-item.tsx` | DMアイテム |
| 5 | `features/chat/components/new-dm-dialog.tsx` | DM作成ダイアログ |
| 6 | `features/user/components/profile-form.tsx` | プロフィール編集 |
| 6 | `features/user/components/user-popover.tsx` | ユーザーカード |
| 6 | `features/chat/components/mention-autocomplete.tsx` | メンション補完 |
| 6 | `features/search/components/search-dialog.tsx` | 検索ダイアログ |
| 6 | `features/navigation/components/quick-switcher.tsx` | Cmd/Ctrl+K 用のクイックスイッチャー |
| 6 | `features/search/components/search-result-pane.tsx` | 検索結果のサイドペイン/ジャンプ |

### 5.3 新規サービス

| Phase | パス | 用途 |
|-------|------|------|
| 4 | `lib/notification-service.ts` | 通知管理 |
| 6 | `lib/hotkey-service.ts` | グローバルショートカット（Cmd/Ctrl+K, 通知トグル 等） |

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
| Phase 3 | Slack-like メッセージ/スレッドUI | 1-2週間 |
| Phase 4 | 未読管理と通知 | 1-2週間 |
| Phase 5 | ダイレクトメッセージ | 2週間 |
| Phase 6 | ユーザー体験の向上 | 2-3週間 |
| **合計** | | **8-13週間** |

---

## 8. 関連ドキュメント

### 8.1 詳細仕様書（作成予定）

**Backend**
- `docs/10_implementation/backend/12_message-threads.md`
- `docs/10_implementation/backend/10_realtime-presence.md`
- `docs/10_implementation/backend/12_message-actions.md`
- `docs/10_implementation/backend/13_unread-management.md`
- `docs/10_implementation/backend/14_direct-messages.md`
- `docs/10_implementation/backend/15_user-profile.md`
- `docs/10_implementation/backend/16_mentions.md`
- `docs/10_implementation/backend/17_message-search.md`

**Frontend**
- `docs/10_implementation/frontend/11_realtime-presence.md`
- `docs/10_implementation/frontend/14_message-threads.md`
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

1. Slack-like メッセージセル/スレッドUIのモックとテーマトークンを定義（左寄せ行、ホバーアクション、右ペイン挙動）。
2. Phase 3 着手準備: スキーマ（parentMessageId/集計カラム）と WS/API (`/messages/:id/thread`, thread系イベント) の仕様をFIXし、マイグレーション手順をまとめる。
3. Phase 4 の未読/通知に向け、`workspace-sidebar`/`unread-separator`/通知設定UIの要件とブラウザ通知許可フローのQAケースを列挙する。
4. Phase 6 を見据えたクイックスイッチャー/検索UIのワイヤーを起こし、ホットキー仕様と検索APIの要求事項を固める。
