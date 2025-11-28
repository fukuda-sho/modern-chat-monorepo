# Slack-like メッセージ/スレッド UI 設計（Phase 3）

## 1. 概要

| 項目 | 内容 |
|------|------|
| フェーズ | Phase 3 |
| 対象 | Frontend（Next.js 16 / React 19） |
| 目的 | LINE/Teams 風の左右吹き出しを廃止し、Slack ライクな左寄せメッセージ行 + 右ペインスレッド体験を実装する |

### 1.1 変更対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `frontend/features/chat/components/message-list.tsx` | 左寄せリスト化・スレッド開封ハンドリング |
| `frontend/features/chat/components/message-item.tsx` | → `message-cell.tsx` に置き換え（左寄せ行 + ホバーtoolbar） |
| `frontend/features/chat/components/message-hover-toolbar.tsx` | ホバーアクション（編集/削除/リアクション/スレッド） |
| `frontend/features/chat/components/thread-pane.tsx` | 右ペイン（親プレビュー + 返信リスト + クローズ） |
| `frontend/features/chat/components/thread-reply-list.tsx` | スレッド内メッセージ表示 |
| `frontend/features/chat/components/thread-reply-input.tsx` | スレッド返信入力 |
| `frontend/features/chat/hooks/use-thread-messages.ts` | スレッド取得/キャッシュ更新 |
| `frontend/lib/socket.ts` | thread 系イベントの購読/キャッシュ反映 |
| `frontend/features/chat/types` | `parentMessageId`/threadメタ型を追加 |
| `frontend/features/chat/api/messages-api.ts` | `/chat/messages/:id/thread` GET/POST を追加 |
| `frontend/features/chat/store/chat-store.ts` | `activeThreadId` 管理を追加 |

---

## 2. UI 方針（Slack に寄せる）

- **左寄せ一列**: 自分/他人ともに同一カラムで表示。吹き出し枠は廃止し、フラットなメッセージセルにする。
- **識別**: 自分のメッセージは背景の微配色 + 「You」チップ + アバター枠で差別化。
- **ホバー操作**: 編集/削除/リアクション/スレッドを 1 つのホバー toolbar にまとめる。
- **スレッド**: 親行に「返信◯件 / 最終返信者・時刻」を表示。クリックで右ペインを開き、スレッド内は時系列で表示。
- **ショートカット**: `Cmd/Ctrl+Shift+Enter` でスレッド返信送信、`Esc` でペインを閉じる。

---

## 3. データフロー

```
[Timeline Fetch]
useInfiniteQuery (room messages, parentMessageId = null, thread summary含む)
      ↓
message-list → message-cell（左寄せ） → thread summary 表示

[Thread Fetch]
useQuery(use-thread-messages) → { parent, replies, pagination }
thread-pane が右ペインで表示

[Real-time]
Socket: messageCreated (親のみ) → timeline cache append
        threadReplyAdded → thread cache append & parent summary update
        threadSummaryUpdated → timelineの親行を部分更新
```

---

## 4. API 仕様（利用）

- `GET /chat/rooms/:roomId/messages`
  - 返却: 親メッセージのみ、`threadReplyCount`/`threadLastRepliedAt`/`threadLastRepliedBy` 付き。
- `GET /chat/messages/:id/thread`
  - 返却: `{ parent, replies, pagination }`
  - `parent` には集計フィールドと `parentMessageId = null` が含まれる。
- `POST /chat/messages/:id/thread`（新規返信）
  - 返却: 返信メッセージ。

---

## 5. WebSocket イベント購読

| Event | 反映先 |
|-------|--------|
| `messageCreated` | タイムラインに親メッセージを追加 |
| `threadReplyAdded` | スレッドキャッシュに返信を追加、親サマリを更新 |
| `threadReplyUpdated` / `threadReplyDeleted` | スレッドキャッシュの該当メッセージを更新/マーク削除 |
| `threadSummaryUpdated` | タイムラインの親メッセージに返信数/最終返信情報を反映 |

---

## 6. 状態管理とキャッシュ

- **TanStack Query**
  - `roomMessagesKeys.room(roomId)`：親メッセージ（タイムライン）
  - `threadKeys.thread(parentId)`：スレッド返信（親 + replies + pagination）
  - Socket からのイベントで `setQueryData` を更新する
- **Zustand (`chat-store`)**
  - `activeThreadId: number | null`
  - `setActiveThread(id | null)` で右ペイン開閉を管理（データソースは Query）。

---

## 7. コンポーネント構成

```
chat/components/
├── message-list.tsx          # 親メッセージ一覧（左寄せ、thread summary 表示）
├── message-cell.tsx          # メッセージ行 + hover toolbar
├── message-hover-toolbar.tsx # アクションボタン群
├── thread-pane.tsx           # 右ペイン。親プレビュー + thread-reply-list + input
├── thread-reply-list.tsx     # スレッド内メッセージ
└── thread-reply-input.tsx    # スレッド返信入力
```

---

## 8. テスト方針

- **ユニット/コンポーネント (Vitest + RTL)**
  - `message-cell`: 左寄せ表示・自分メッセージのスタイル・ホバーで toolbar が出ること
  - `thread-pane`: 親プレビュー表示、返信リストが並ぶこと、Esc で閉じること
- **フック**
  - `use-thread-messages`: 取得とページネーション、キャッシュ更新ヘルパー
- **ソケットハンドラ**
  - `threadReplyAdded` 受信で timeline の親サマリが更新されることを `setQueryData` モックで確認

---

## 9. 完了条件

- タイムラインが左寄せのメッセージ行に統一されていること。
- 親メッセージから「返信◯件」をクリックして右ペインを開き、返信の送信/閲覧ができること。
- スレッド返信が届くとタイムラインの返信数・最終返信がリアルタイムに更新されること。
