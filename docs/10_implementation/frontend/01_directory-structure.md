# フロントエンド ディレクトリ構成仕様書

## 1. 概要

本ドキュメントは、フロントエンドプロジェクトのディレクトリ構成と命名規則を定義する。
Feature-Sliced Design を参考にした、機能ベースのモジュール構成を採用する。

---

## 2. ディレクトリツリー

```
frontend/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # 認証グループ（未認証ユーザー向け）
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (main)/                       # メイングループ（認証必須）
│   │   ├── chat/
│   │   │   ├── [roomId]/
│   │   │   │   └── page.tsx          # 個別チャットルーム
│   │   │   └── page.tsx              # ルーム一覧
│   │   ├── settings/
│   │   │   └── page.tsx              # 設定画面
│   │   └── layout.tsx
│   ├── api/                          # Route Handlers（必要に応じて）
│   ├── error.tsx                     # エラーバウンダリ
│   ├── globals.css                   # グローバルスタイル
│   ├── layout.tsx                    # ルートレイアウト
│   ├── loading.tsx                   # グローバルローディング
│   ├── not-found.tsx                 # 404 ページ
│   └── page.tsx                      # ランディングページ
│
├── components/                       # 共有 UI コンポーネント
│   ├── ui/                           # shadcn/ui コンポーネント
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── scroll-area.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   └── ...
│   ├── layout/                       # レイアウトコンポーネント
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── main-layout.tsx
│   │   └── auth-layout.tsx
│   └── common/                       # 汎用コンポーネント
│       ├── loading-spinner.tsx
│       ├── error-boundary.tsx
│       └── empty-state.tsx
│
├── features/                         # 機能モジュール
│   ├── auth/                         # 認証機能
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── auth-guard.tsx
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   └── use-current-user.ts
│   │   ├── api/
│   │   │   └── auth-api.ts
│   │   ├── schemas/
│   │   │   ├── login-schema.ts
│   │   │   └── signup-schema.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts                  # バレルエクスポート
│   │
│   └── chat/                         # チャット機能
│       ├── components/
│       │   ├── chat-room.tsx
│       │   ├── message-list.tsx
│       │   ├── message-item.tsx
│       │   ├── message-input.tsx
│       │   ├── room-list.tsx
│       │   ├── room-item.tsx
│       │   ├── typing-indicator.tsx
│       │   └── online-status.tsx
│       ├── hooks/
│       │   ├── use-chat-socket.ts
│       │   ├── use-messages.ts
│       │   └── use-rooms.ts
│       ├── api/
│       │   ├── chat-api.ts
│       │   └── room-api.ts
│       ├── store/
│       │   └── chat-store.ts
│       ├── types/
│       │   └── index.ts
│       └── index.ts
│
├── lib/                              # ユーティリティ・インフラ層
│   ├── api-client.ts                 # HTTP クライアント
│   ├── socket.ts                     # WebSocket サービス
│   ├── query-client.ts               # TanStack Query 設定
│   ├── utils.ts                      # 汎用ユーティリティ（cn 関数等）
│   └── constants.ts                  # 定数定義
│
├── types/                            # 共通型定義
│   ├── api.ts                        # API レスポンス型
│   ├── user.ts                       # ユーザー関連型
│   ├── chat.ts                       # チャット関連型
│   └── index.ts
│
├── providers/                        # Context プロバイダー
│   ├── query-provider.tsx            # TanStack Query
│   ├── theme-provider.tsx            # next-themes
│   └── index.tsx                     # 統合プロバイダー
│
├── hooks/                            # 共有カスタムフック
│   ├── use-local-storage.ts
│   ├── use-media-query.ts
│   └── use-debounce.ts
│
├── config/                           # アプリ設定
│   └── site.ts                       # サイトメタデータ
│
├── public/                           # 静的アセット
│   ├── images/
│   └── icons/
│
├── .env.local                        # 環境変数（ローカル）
├── .env.example                      # 環境変数サンプル
├── .eslintrc.js                      # ESLint 設定
├── .prettierrc                       # Prettier 設定
├── components.json                   # shadcn/ui 設定
├── next.config.ts                    # Next.js 設定
├── package.json
├── postcss.config.js                 # PostCSS 設定
├── tailwind.config.ts                # Tailwind 設定
├── tsconfig.json                     # TypeScript 設定
└── vitest.config.ts                  # Vitest 設定
```

---

## 3. 各ディレクトリの役割

### 3.1 `app/` - ルーティング層

Next.js App Router のファイルベースルーティングを担当。

| パス | 役割 |
|------|------|
| `app/(auth)/` | 未認証ユーザー向けページ群（ログイン、サインアップ） |
| `app/(main)/` | 認証必須ページ群（チャット、設定） |
| `app/layout.tsx` | ルートレイアウト（プロバイダー設定） |

**ルートグループの使用:**

```
(auth)  → 未認証レイアウト（シンプル、中央寄せ）
(main)  → 認証済みレイアウト（サイドバー、ヘッダー付き）
```

### 3.2 `components/` - 共有 UI コンポーネント

機能横断で使用される UI コンポーネント。

| サブディレクトリ | 内容 |
|-----------------|------|
| `ui/` | shadcn/ui コンポーネント（自動生成） |
| `layout/` | ページレイアウト関連 |
| `common/` | 汎用的な表示コンポーネント |

### 3.3 `features/` - 機能モジュール

Feature-Sliced Design に基づく機能単位のモジュール。

```
features/
└── {feature-name}/
    ├── components/     # 機能固有の UI コンポーネント
    ├── hooks/          # 機能固有のカスタムフック
    ├── api/            # API 呼び出し関数
    ├── store/          # Zustand ストア（必要な場合）
    ├── schemas/        # Zod スキーマ
    ├── types/          # 型定義
    └── index.ts        # パブリック API（バレルエクスポート）
```

**インポートルール:**

```typescript
// Good: バレルエクスポートからインポート
import { LoginForm, useAuth } from '@/features/auth';

// Bad: 内部パスを直接参照
import { LoginForm } from '@/features/auth/components/login-form';
```

### 3.4 `lib/` - インフラ層

外部サービスとの連携、ユーティリティ関数。

| ファイル | 役割 |
|---------|------|
| `api-client.ts` | fetch ベースの HTTP クライアント |
| `socket.ts` | Socket.IO クライアント管理 |
| `query-client.ts` | TanStack Query 設定 |
| `utils.ts` | 汎用ユーティリティ（`cn()` 等） |

### 3.5 `types/` - 共通型定義

機能横断で使用される型定義。

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// types/user.ts
export interface User {
  id: number;
  email: string;
  username: string;
  createdAt: string;
}
```

### 3.6 `providers/` - コンテキストプロバイダー

アプリ全体で使用するプロバイダーを集約。

```typescript
// providers/index.tsx
'use client';

import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </QueryProvider>
  );
}
```

---

## 4. 命名規則

### 4.1 ファイル名

| 種別 | 規則 | 例 |
|------|------|-----|
| コンポーネント | kebab-case | `message-list.tsx` |
| フック | kebab-case (use- prefix) | `use-auth.ts` |
| ユーティリティ | kebab-case | `api-client.ts` |
| 型定義 | kebab-case | `chat-types.ts` |
| 定数 | kebab-case | `constants.ts` |

### 4.2 エクスポート名

| 種別 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `MessageList` |
| フック | camelCase (use prefix) | `useAuth` |
| 関数 | camelCase | `formatDate` |
| 型/インターフェース | PascalCase | `ChatMessage` |
| 定数 | SCREAMING_SNAKE_CASE | `API_BASE_URL` |

### 4.3 コンポーネントファイル構成

```typescript
// features/chat/components/message-item.tsx

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import type { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  className?: string;
}

/**
 * 個別メッセージの表示コンポーネント
 * @param message - メッセージデータ
 * @param isOwn - 自分のメッセージかどうか
 */
function MessageItemComponent({ message, isOwn, className }: MessageItemProps) {
  return (
    <div className={cn('flex gap-3', isOwn && 'flex-row-reverse', className)}>
      {/* ... */}
    </div>
  );
}

export const MessageItem = memo(MessageItemComponent);
```

---

## 5. インポートエイリアス

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**使用例:**

```typescript
// 絶対パスインポート
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth';
import { apiClient } from '@/lib/api-client';
import type { User } from '@/types';
```

---

## 6. バレルエクスポートのルール

各 feature には `index.ts` でパブリック API を定義。

```typescript
// features/auth/index.ts
// Components
export { LoginForm } from './components/login-form';
export { SignupForm } from './components/signup-form';
export { AuthGuard } from './components/auth-guard';

// Hooks
export { useAuth } from './hooks/use-auth';
export { useCurrentUser } from './hooks/use-current-user';

// Types
export type { LoginFormData, SignupFormData } from './types';
```

**注意:** 内部実装（api/, store/, schemas/）は直接エクスポートしない。

---

## 7. テストファイルの配置

```
features/
└── chat/
    ├── components/
    │   ├── message-list.tsx
    │   └── __tests__/
    │       └── message-list.test.tsx
    └── hooks/
        ├── use-chat-socket.ts
        └── __tests__/
            └── use-chat-socket.test.ts
```

**E2E テスト:**

```
frontend/
├── e2e/
│   ├── auth.spec.ts
│   ├── chat.spec.ts
│   └── fixtures/
└── playwright.config.ts
```

---

## 8. 関連ドキュメント

- [00_tech-stack-architecture.md](./00_tech-stack-architecture.md) - 技術スタック詳細
- [02_auth-pages.md](./02_auth-pages.md) - 認証画面仕様
- [03_chat-room-ui.md](./03_chat-room-ui.md) - チャット画面仕様
