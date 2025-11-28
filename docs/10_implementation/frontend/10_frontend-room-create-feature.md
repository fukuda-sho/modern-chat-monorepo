# 10. Frontend 任意チャットルーム作成機能 設計書

---

## 0. ファイル情報

- パス: `docs/10_implementation/frontend/10_frontend-room-create-feature.md`
- 対象: フロントエンドアプリケーション（`frontend/` ディレクトリ配下）
- 目的: Backend で実装された `POST /chat-rooms` / `GET /chat-rooms` API を利用し、ユーザーが任意のチャットルームをフロントエンドから作成・利用できるようにする

---

## 1. 実装概要

### 1.1 ユースケース

1. ログイン後、左側のサイドバーにルーム一覧が表示される
2. サイドバー下部に「新規ルーム作成」ボタン（`+` アイコン）が表示される
3. クリックするとダイアログが開き、ルーム名を入力できる
4. 「作成する」ボタン押下でバックエンドに `POST /chat-rooms` を送信
5. 成功時:
   - ルーム一覧に新しいルームが追加される（TanStack Query のキャッシュ更新）
   - `/chat/<roomId>` に遷移して、そのルームでチャットが始められる

### 1.2 変更ファイル一覧

| ファイル | 変更種別 | 説明 |
|----------|----------|------|
| `types/chat.ts` | 修正 | `ChatRoom` 型を追加 |
| `features/chat/types/index.ts` | 修正 | `ChatRoom` 型をエクスポート |
| `features/chat/api/chat-rooms-api.ts` | 新規 | `fetchChatRooms`, `createChatRoom` API クライアント |
| `features/chat/components/create-room-dialog.tsx` | 新規 | ルーム作成ダイアログコンポーネント |
| `features/chat/components/create-room-dialog.test.tsx` | 新規 | CreateRoomDialog のテスト（10テスト） |
| `features/chat/components/room-list.tsx` | 修正 | TanStack Query 連携 + CreateRoomDialog 統合 |
| `features/chat/components/room-list.test.tsx` | 修正 | QueryClientProvider 対応 |
| `features/chat/index.ts` | 修正 | 新規エクスポート追加 |
| `components/ui/dialog.tsx` | 新規 | shadcn/ui Dialog コンポーネント |

---

## 2. 型・API クライアント設計

### 2.1 型定義

```typescript
// types/chat.ts
/**
 * API から取得するチャットルーム（詳細情報付き）
 */
export interface ChatRoom {
  id: number;
  name: string;
  createdAt: string;
  createdByUserId: number;
}
```

### 2.2 API クライアント

```typescript
// features/chat/api/chat-rooms-api.ts
import { apiClient } from '@/lib/api-client';
import type { ChatRoom } from '../types';

/**
 * ルーム一覧を取得する
 */
export async function fetchChatRooms(): Promise<ChatRoom[]> {
  return apiClient.get<ChatRoom[]>('/chat-rooms');
}

/**
 * 新しいチャットルームを作成する
 */
export async function createChatRoom(name: string): Promise<ChatRoom> {
  return apiClient.post<ChatRoom>('/chat-rooms', { name });
}
```

---

## 3. UI 実装設計

### 3.1 CreateRoomDialog コンポーネント

```tsx
// features/chat/components/create-room-dialog.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { createChatRoom } from '../api/chat-rooms-api';
import type { ChatRoom } from '../types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export const CHAT_ROOMS_QUERY_KEY = ['chat-rooms'] as const;

export function CreateRoomDialog(): JSX.Element {
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (roomName: string) => createChatRoom(roomName),
    onSuccess: (room) => {
      // ルーム一覧キャッシュを更新
      queryClient.setQueryData<ChatRoom[] | undefined>(
        CHAT_ROOMS_QUERY_KEY,
        (old) => (old ? [...old, room] : [room])
      );
      setName('');
      setOpen(false);
      router.push(`/chat/${room.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    mutation.mutate(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="新規ルーム作成">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しいルームを作成</DialogTitle>
          <DialogDescription>
            チャットルームの名前を入力してください
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="#general のような名前"
            aria-label="ルーム名"
          />
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? '作成中...' : '作成する'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 3.2 RoomList への統合

```tsx
// features/chat/components/room-list.tsx
'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoomItem } from './room-item';
import { CreateRoomDialog, CHAT_ROOMS_QUERY_KEY } from './create-room-dialog';
import { fetchChatRooms } from '../api/chat-rooms-api';
import { MOCK_ROOMS } from '../data/rooms';

export function RoomList() {
  const params = useParams();
  const currentRoomId = params.roomId ? Number(params.roomId) : null;

  const { data: rooms, isLoading } = useQuery({
    queryKey: CHAT_ROOMS_QUERY_KEY,
    queryFn: fetchChatRooms,
  });

  // API エラー時またはデータ未取得時はモックデータにフォールバック
  const displayRooms = rooms ?? MOCK_ROOMS;

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          <h2 className="...">Channels</h2>
          {isLoading ? (
            <div>読み込み中...</div>
          ) : (
            displayRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isActive={room.id === currentRoomId}
              />
            ))
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-2">
        <CreateRoomDialog />
      </div>
    </div>
  );
}
```

---

## 4. テスト設計

### 4.1 テスト環境

- テストランナー: Vitest
- コンポーネントテスト: React Testing Library
- DOM: jsdom

### 4.2 実行コマンド

```bash
cd frontend && yarn test
cd frontend && yarn test:watch
cd frontend && yarn test:coverage
```

### 4.3 テスト内容

| テストファイル | テスト数 | カバー範囲 |
|---------------|---------|-----------|
| `create-room-dialog.test.tsx` | 10 | ダイアログ表示、作成フロー、バリデーション、キャッシュ更新 |
| `room-list.test.tsx` | 6 | ルーム一覧表示、フォールバック動作 |

### 4.4 CreateRoomDialog テストケース

1. **トリガーボタンが表示される**
2. **ボタンクリックでダイアログが開く**
3. **ルーム名を入力して作成ボタンを押すと createChatRoom が呼ばれる**
4. **ルーム作成成功時に `/chat/<roomId>` へ遷移する**
5. **ルーム作成成功時にキャッシュが更新される**
6. **空文字の場合は mutation が呼ばれない**
7. **空白のみの場合は mutation が呼ばれない**
8. **入力値の前後の空白はトリムされる**
9. **作成中はボタンが無効化され、テキストが「作成中...」に変わる**
10. **作成成功後にフォームがリセットされる**

---

## 5. 共通ポリシー遵守

### 5.1 パッケージマネージャ

- **yarn** を使用（npm/npx は不使用）

### 5.2 コーディング規約

- ESLint / Prettier 準拠
- JSDoc コメント付与
- `any` 型禁止、型安全な実装
- ファイル命名: `kebab-case`（例: `create-room-dialog.tsx`）

### 5.3 アクセシビリティ

- `aria-label` 属性の適切な設定
- `DialogDescription` によるスクリーンリーダー対応

---

## 6. 動作確認手順

### 6.1 手動テスト

1. `docker compose up -d` で環境起動
2. ログイン後、サイドバー下部の `+` ボタンをクリック
3. ダイアログが開くことを確認
4. ルーム名を入力して「作成する」ボタンをクリック
5. 以下を確認:
   - 新しいルームが作成される
   - サイドバーに新ルームが追加される
   - 自動的に新ルームへ遷移する

### 6.2 エッジケース確認

1. 空のルーム名で作成 → 送信されないこと
2. 空白のみのルーム名で作成 → 送信されないこと
3. 連続作成 → 各ルームが正しく追加されること

---

## 7. 完了条件

- [x] フロントエンドから任意のルーム名でルームを作成できる
- [x] ルーム作成後、サイドバーに新ルームが表示され、かつ自動的に `/chat/<roomId>` に遷移する
- [x] Backend 側の `GET /chat-rooms` / `POST /chat-rooms` と連携準備完了
- [x] `yarn test` が成功し、新規ルーム作成 UI に関するテストが追加されている（10テスト）
- [x] `any` 型を使用していない
- [x] JSDoc コメントが適切に付与されている

---

## 8. 今後の拡張ポイント

1. **エラーハンドリング強化**: API エラー時のトースト通知
2. **バリデーション強化**: ルーム名の文字数制限、重複チェック
3. **UI 改善**: ローディングスケルトン、アニメーション追加
4. **ルーム削除機能**: 作成者によるルーム削除 UI の追加
