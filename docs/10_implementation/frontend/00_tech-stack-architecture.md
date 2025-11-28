# フロントエンド技術選定・アーキテクチャ設計書

## 1. 概要

本ドキュメントは、リアルタイムチャットアプリケーションのフロントエンド技術選定とアーキテクチャ設計を定義する。

### 1.1 前提条件

- アプリ種別: リアルタイムチャットアプリケーション
- バックエンド: NestJS + Prisma + MySQL（実装済み）
- 認証方式: JWT ベース
- リアルタイム通信: Socket.IO

---

## 2. 技術スタック一覧

| カテゴリ | 採用技術 | バージョン |
|---------|---------|-----------|
| フレームワーク | Next.js (App Router) | 15.x |
| 言語 | TypeScript | 5.x |
| UI ライブラリ | React | 19.x |
| スタイリング | Tailwind CSS | 4.x |
| UI コンポーネント | shadcn/ui | latest |
| クライアント状態管理 | Zustand | 5.x |
| サーバー状態管理 | TanStack Query | 5.x |
| WebSocket | socket.io-client | 4.x |
| フォーム | react-hook-form | 7.x |
| バリデーション | Zod | 3.x |
| 単体テスト | Vitest + React Testing Library | latest |
| E2E テスト | Playwright | latest |
| Lint | ESLint | 9.x |
| Formatter | Prettier | 3.x |
| Git Hooks | Husky + lint-staged | latest |
| 国際化（将来） | next-intl | latest |

---

## 3. コアフレームワーク詳細

### 3.1 Next.js 15 (App Router)

**採用理由:**

- React 19 の Server Components / Server Actions をフル活用
- ファイルベースルーティングによる直感的な構成
- 組み込みの最適化（画像、フォント、スクリプト）
- Vercel / セルフホスト両対応

**レンダリング戦略:**

| ページ種別 | 戦略 | 理由 |
|-----------|------|------|
| ランディングページ | SSG | 静的コンテンツ、SEO 最適化 |
| ログイン/サインアップ | SSR | 認証状態チェック、リダイレクト制御 |
| チャットルーム一覧 | SSR + CSR | 初期データは SSR、以降は CSR で更新 |
| チャットルーム内 | CSR | リアルタイム更新が主、WebSocket 依存 |

### 3.2 TypeScript (Strict Mode)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## 4. スタイリング設計

### 4.1 Tailwind CSS v4

**設計方針:**

- Utility-first アプローチ
- デザイントークンによる一貫性担保
- CSS Variables によるダークモード対応

**カスタムテーマ設定:**

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          // ... 50-950
          DEFAULT: 'var(--color-primary-500)',
        },
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
    },
  },
};
```

### 4.2 ダークモード対応

```css
/* globals.css */
:root {
  --color-background: 255 255 255;
  --color-foreground: 10 10 10;
  /* Light mode colors */
}

.dark {
  --color-background: 10 10 10;
  --color-foreground: 250 250 250;
  /* Dark mode colors */
}
```

**実装方針:**

- `next-themes` による切り替え管理
- システム設定の自動検知
- ユーザー設定の localStorage 保存

---

## 5. UI コンポーネント

### 5.1 shadcn/ui

**採用理由:**

| 観点 | 評価 |
|------|------|
| Tailwind 統合 | ネイティブ対応、追加設定不要 |
| カスタマイズ性 | コードコピー方式で完全制御可能 |
| アクセシビリティ | Radix UI ベースで WCAG 準拠 |
| バンドルサイズ | 使用コンポーネントのみ含まれる |
| TypeScript | 完全な型定義 |

**代替候補と不採用理由:**

| ライブラリ | 不採用理由 |
|-----------|-----------|
| Headless UI | コンポーネント数が限定的 |
| Radix UI (直接) | 低レベル過ぎ、スタイリング工数大 |
| Chakra UI | 独自スタイルシステム、Tailwind 併用非効率 |
| MUI | Material Design 制約、Tailwind 非互換 |

**使用予定コンポーネント:**

- Button, Input, Label, Card
- Dialog, Dropdown Menu, Popover
- Avatar, Badge, Separator
- Toast, Tooltip
- ScrollArea (チャット用)

---

## 6. 状態管理設計

### 6.1 状態の分類

```
┌─────────────────────────────────────────────────────────────┐
│                      状態管理戦略                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Server State   │  │  Client State   │                  │
│  │  (TanStack Q)   │  │   (Zustand)     │                  │
│  ├─────────────────┤  ├─────────────────┤                  │
│  │ - ユーザー情報   │  │ - UI 状態       │                  │
│  │ - ルーム一覧    │  │ - モーダル開閉   │                  │
│  │ - 過去メッセージ │  │ - サイドバー    │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │          Real-time State (Zustand)      │               │
│  ├─────────────────────────────────────────┤               │
│  │ - WebSocket 接続状態                     │               │
│  │ - リアルタイムメッセージ                  │               │
│  │ - タイピングインジケータ                  │               │
│  │ - オンラインユーザー                      │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Zustand (クライアント状態)

**採用理由:**

| 観点 | 評価 |
|------|------|
| バンドルサイズ | ~2KB (gzipped) |
| 学習コスト | 低（シンプル API） |
| TypeScript | 優秀な型推論 |
| React 外アクセス | 可能（WebSocket コールバック向け） |
| DevTools | Redux DevTools 対応 |

**代替候補と不採用理由:**

| ライブラリ | 不採用理由 |
|-----------|-----------|
| Redux Toolkit | ボイラープレート過多、この規模では過剰 |
| Jotai | アトミック設計はチャット状態に不向き |
| Recoil | Meta サポート縮小、開発停滞 |

**Store 設計例:**

```typescript
// features/chat/store/chat-store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Message {
  id: number;
  roomId: number;
  userId: number;
  content: string;
  createdAt: string;
}

interface ChatState {
  messages: Map<number, Message[]>;
  currentRoomId: number | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';

  // Actions
  addMessage: (roomId: number, message: Message) => void;
  setCurrentRoom: (roomId: number | null) => void;
  setConnectionStatus: (status: ChatState['connectionStatus']) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      messages: new Map(),
      currentRoomId: null,
      connectionStatus: 'disconnected',

      addMessage: (roomId, message) =>
        set((state) => {
          const roomMessages = state.messages.get(roomId) || [];
          const newMessages = new Map(state.messages);
          newMessages.set(roomId, [...roomMessages, message]);
          return { messages: newMessages };
        }),

      setCurrentRoom: (roomId) =>
        set({ currentRoomId: roomId }),

      setConnectionStatus: (status) =>
        set({ connectionStatus: status }),
    }),
    { name: 'chat-store' }
  )
);
```

### 6.3 TanStack Query v5 (サーバー状態)

**採用理由:**

| 観点 | 評価 |
|------|------|
| キャッシュ管理 | 自動、設定可能 |
| 再検証 | stale-while-revalidate パターン |
| 楽観的更新 | 組み込みサポート |
| エラーハンドリング | リトライ、フォールバック |
| DevTools | 専用 DevTools 提供 |

**設定例:**

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      gcTime: 1000 * 60 * 30,   // 30分
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

---

## 7. リアルタイム通信設計

### 7.1 アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    React Component                          │
│                                                             │
│  const { sendMessage, isConnected } = useChatSocket();      │
│  const messages = useChatStore((s) => s.messages);          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   useChatSocket() Hook                       │
│                                                             │
│  - useEffect で接続/切断管理                                 │
│  - イベントリスナー登録                                      │
│  - 送信メソッドをメモ化して返却                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              SocketService (Singleton Class)                │
│                                                             │
│  - socket.io-client インスタンス管理                         │
│  - 認証トークン付与（auth フィールド）                       │
│  - 自動再接続（exponential backoff）                         │
│  - イベント発行/購読の抽象化                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Zustand Store                            │
│                                                             │
│  - WebSocket イベントで直接更新                              │
│  - React 外からアクセス可能                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 再接続戦略

```typescript
// lib/socket.ts
const RECONNECT_CONFIG = {
  maxAttempts: 10,
  baseDelay: 1000,      // 1秒
  maxDelay: 30000,      // 30秒
  multiplier: 2,
};

// Exponential backoff
const getReconnectDelay = (attempt: number): number => {
  const delay = RECONNECT_CONFIG.baseDelay *
    Math.pow(RECONNECT_CONFIG.multiplier, attempt);
  return Math.min(delay, RECONNECT_CONFIG.maxDelay);
};
```

### 7.3 イベントマッピング

| バックエンドイベント | フロントエンド処理 |
|---------------------|-------------------|
| `roomJoined` | `useChatStore.setCurrentRoom()` |
| `roomLeft` | `useChatStore.setCurrentRoom(null)` |
| `messageCreated` | `useChatStore.addMessage()` |
| `error` | Toast 表示 + ログ |

---

## 8. フォーム・バリデーション

### 8.1 react-hook-form + Zod

**採用理由:**

- 非制御コンポーネントによる高パフォーマンス
- Zod との統合で型安全なバリデーション
- バックエンドとスキーマ共有可能

**実装例:**

```typescript
// features/auth/schemas/login-schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードは必須です')
    .min(8, 'パスワードは8文字以上で入力してください'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

```typescript
// features/auth/components/login-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../schemas/login-schema';

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    // API 呼び出し
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* フォームフィールド */}
    </form>
  );
}
```

---

## 9. テスト戦略

### 9.1 テストピラミッド

```
        ┌───────────┐
        │   E2E     │  Playwright
        │  (少数)   │  - 重要フロー
        ├───────────┤
        │ Integration│  Vitest + RTL
        │  (中程度)  │  - コンポーネント連携
        ├───────────┤
        │   Unit    │  Vitest
        │  (多数)   │  - ユーティリティ、フック
        └───────────┘
```

### 9.2 各テスト種別の責務

| 種別 | ツール | 対象 |
|------|--------|------|
| Unit | Vitest | ユーティリティ関数、Zod スキーマ、Store ロジック |
| Integration | Vitest + RTL | コンポーネント、カスタムフック |
| E2E | Playwright | ログインフロー、チャット送受信 |

### 9.3 カバレッジ目標

- Unit: 80%以上
- Integration: 重要コンポーネント 100%
- E2E: クリティカルパス 100%

---

## 10. 開発ツール・品質管理

### 10.1 ESLint 設定

```javascript
// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  }
);
```

### 10.2 Prettier 設定

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 10.3 Git Hooks (Husky + lint-staged)

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### 10.4 Commitlint

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    ],
  },
};
```

---

## 11. アクセシビリティ (a11y)

### 11.1 基本方針

- WCAG 2.1 Level AA 準拠を目標
- shadcn/ui (Radix UI ベース) により基本的な a11y 担保
- キーボードナビゲーション必須
- スクリーンリーダー対応

### 11.2 チェック項目

- [ ] すべてのインタラクティブ要素にフォーカス表示
- [ ] 適切な ARIA ラベル付与
- [ ] カラーコントラスト比 4.5:1 以上
- [ ] フォームエラーの適切な通知

---

## 12. パフォーマンス最適化

### 12.1 チャット特有の最適化

| 課題 | 対策 |
|------|------|
| 大量メッセージ | 仮想スクロール（@tanstack/react-virtual） |
| 頻繁な再レンダリング | React.memo、useMemo、useCallback |
| 画像読み込み | next/image による最適化、遅延読み込み |
| バンドルサイズ | Dynamic Import、Tree Shaking |

### 12.2 Core Web Vitals 目標

| 指標 | 目標値 |
|------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |

---

## 13. 環境変数

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

**命名規則:**

- `NEXT_PUBLIC_` プレフィックス: クライアントサイドで使用
- プレフィックスなし: サーバーサイドのみ

---

## 14. 関連ドキュメント

- [01_directory-structure.md](./01_directory-structure.md) - ディレクトリ構成詳細
- [02_auth-pages.md](./02_auth-pages.md) - 認証画面仕様
- [03_chat-room-ui.md](./03_chat-room-ui.md) - チャット画面仕様
- [04_websocket-integration.md](./04_websocket-integration.md) - WebSocket 統合仕様
