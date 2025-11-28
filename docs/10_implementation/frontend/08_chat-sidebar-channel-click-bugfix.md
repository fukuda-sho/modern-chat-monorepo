# 08. チャットサイドバーのチャンネルクリック時エラー修正設計書

---

## 0. ファイル情報

- パス: `docs/10_implementation/frontend/08_chat-sidebar-channel-click-bugfix.md`
- 対象: フロントエンドアプリケーション（`frontend/` ディレクトリ配下）
- 目的: サイドバーのチャンネルクリック時のエラー修正と単体テストの追加

---

## 1. 実装概要

### 1.1 修正内容

1. **ルームデータ管理の共通化**
   - `features/chat/data/rooms.ts` を新規作成
   - `MOCK_ROOMS`, `getRoomById()`, `isValidRoomId()` をエクスポート
   - RoomList と ChatRoomPage で共通のデータソースを使用

2. **ChatRoomPage の改善**
   - 存在しない roomId のエラーハンドリング追加
   - ルーム名を ChatRoom に渡すように修正

3. **ChatRoom の改善**
   - 接続中・エラー状態の視覚的フィードバック追加
   - useEffect の依存関係を最適化

4. **テストの追加**
   - `rooms.test.ts`: ルームデータユーティリティのテスト（8テスト）
   - `chat-room.test.tsx`: ChatRoom コンポーネントのテスト（11テスト）
   - `room-list.test.tsx`: 既存テストを更新（6テスト）

### 1.2 変更ファイル一覧

| ファイル | 変更種別 | 説明 |
|----------|----------|------|
| `features/chat/data/rooms.ts` | 新規 | ルームデータ管理ユーティリティ |
| `features/chat/data/rooms.test.ts` | 新規 | ルームデータのテスト |
| `features/chat/components/room-list.tsx` | 修正 | 共通データソースを使用 |
| `features/chat/components/chat-room.tsx` | 修正 | 接続状態のフィードバック追加 |
| `features/chat/components/chat-room.test.tsx` | 新規 | ChatRoom のテスト |
| `features/chat/components/room-list.test.tsx` | 修正 | テスト更新 |
| `features/chat/index.ts` | 修正 | 新規エクスポート追加 |
| `app/(main)/chat/[roomId]/page.tsx` | 修正 | roomId 検証と roomName 渡し |

---

## 2. 実装詳細

### 2.1 ルームデータユーティリティ

```typescript
// features/chat/data/rooms.ts
export const MOCK_ROOMS: Room[] = [
  { id: 1, name: 'general' },
  { id: 2, name: 'random' },
  { id: 3, name: 'development' },
];

export function getRoomById(roomId: number): Room | undefined;
export function isValidRoomId(roomId: number): boolean;
```

### 2.2 ChatRoomPage のエラーハンドリング

```typescript
// app/(main)/chat/[roomId]/page.tsx
export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { roomId } = await params;
  const roomIdNum = Number(roomId);

  // 無効な数値の場合
  if (isNaN(roomIdNum)) {
    return <ErrorMessage>無効なルームIDです</ErrorMessage>;
  }

  // 存在しないルームの場合
  if (!isValidRoomId(roomIdNum)) {
    return <ErrorMessage>チャンネルが見つかりません</ErrorMessage>;
  }

  const room = getRoomById(roomIdNum);
  return <ChatRoom roomId={roomIdNum} roomName={room?.name} />;
}
```

### 2.3 ChatRoom の接続状態フィードバック

```tsx
// features/chat/components/chat-room.tsx
export function ChatRoom({ roomId, roomName }: ChatRoomProps) {
  const { connectionStatus } = useChatSocket();

  return (
    <div>
      {/* 接続中の場合はローディング表示 */}
      {connectionStatus === 'connecting' && (
        <div>接続中...</div>
      )}

      {/* 接続エラーの場合は警告表示 */}
      {connectionStatus === 'error' && (
        <div>接続エラーが発生しました</div>
      )}

      <MessageList />
      <MessageInput />
    </div>
  );
}
```

---

## 3. テストカバレッジ

### 3.1 実行コマンド

```bash
cd frontend && yarn test
cd frontend && yarn test:coverage
```

### 3.2 テスト内容

| テストファイル | テスト数 | カバー範囲 |
|---------------|---------|-----------|
| `rooms.test.ts` | 8 | MOCK_ROOMS, getRoomById, isValidRoomId |
| `chat-room.test.tsx` | 11 | レンダリング, 接続状態, joinRoom/leaveRoom |
| `room-list.test.tsx` | 6 | チャンネル表示, リンク, アクティブ状態 |
| `room-item.test.tsx` | 5 | 既存テスト |
| `use-chat-socket.test.ts` | 11 | 既存テスト |

**合計: 41テスト（チャット機能関連）**

### 3.3 テスト観点

1. **RoomList / RoomItem**
   - チャンネル一覧が全て表示されること
   - クリック時に正しい `/chat/{roomId}` パスへのリンクが提供されること
   - アクティブ状態のスタイル適用

2. **ChatRoom**
   - roomId と roomName が正しく表示されること
   - 接続中・エラー状態の UI 表示
   - joinRoom/leaveRoom の呼び出しタイミング

3. **useChatSocket**
   - 接続状態の管理
   - ルーム操作メソッドの呼び出し

---

## 4. 動作確認手順

### 4.1 手動テスト

1. `docker compose up -d` で環境起動
2. ログイン後、サイドバーの `#general` をクリック
3. 以下を確認:
   - エラーが発生しないこと
   - ルームヘッダーに "general" が表示されること
   - メッセージ入力が有効になること
4. 他のチャンネル（`#random`, `#development`）に切り替えて同様に確認

### 4.2 エッジケース確認

1. 直接 URL `/chat/999` にアクセス → 「チャンネルが見つかりません」表示
2. 直接 URL `/chat/abc` にアクセス → 「無効なルームIDです」表示
3. WebSocket 切断時 → 「接続中...」表示と入力無効化

---

## 5. 完了条件

- [x] ログイン後にサイドバーのチャンネルクリックでエラーが発生しない
- [x] クリックしたチャンネルのメッセージ一覧が正常に表示される
- [x] チャンネル切り替えでエラーが発生しない
- [x] `yarn test` が成功する
- [x] 新規テストが追加されている（20テスト以上）
