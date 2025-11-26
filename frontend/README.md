# Chat Application Frontend

Next.js ベースのリアルタイムチャットアプリケーション フロントエンド

## 技術スタック

| カテゴリ             | 技術                  | バージョン |
| -------------------- | --------------------- | ---------- |
| フレームワーク       | Next.js (App Router)  | 16.0.4     |
| 言語                 | TypeScript            | 5.x        |
| UI ライブラリ        | React                 | 19.2.0     |
| スタイリング         | Tailwind CSS          | 4.x        |
| UI コンポーネント    | shadcn/ui (Radix UI)  | -          |
| 状態管理             | Zustand               | 5.x        |
| サーバー状態         | TanStack Query        | 5.x        |
| フォーム             | React Hook Form + Zod | 7.x / 4.x  |
| リアルタイム通信     | Socket.io Client      | 4.x        |
| パッケージマネージャ | Yarn (Berry)          | 4.x        |

## クイックスタート

```bash
# プロジェクトルートで実行
cd /home/deploy/development

# 全サービス起動（db, backend, frontend）
docker compose up -d

# フロントエンドのみ起動
docker compose up frontend -d

# ログ確認
docker compose logs -f frontend

# 停止
docker compose down
```

→ http://localhost:3001

## サービス構成

| サービス | コンテナ名        | ホストポート | コンテナポート |
| -------- | ----------------- | ------------ | -------------- |
| frontend | chat_app_frontend | 3001         | 3000           |
| backend  | chat_app_backend  | 3000         | 3000           |
| db       | chat_app_db       | 3307         | 3306           |

## ディレクトリ構成

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証関連ページ
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (main)/                   # メインアプリページ
│   │   ├── chat/
│   │   │   ├── [roomId]/page.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/                   # 共通コンポーネント
│   ├── layout/                   # レイアウト
│   │   ├── auth-layout.tsx
│   │   ├── header.tsx
│   │   ├── main-layout.tsx
│   │   └── sidebar.tsx
│   └── ui/                       # shadcn/ui
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       ├── sonner.tsx
│       └── textarea.tsx
│
├── config/                       # 設定
│   └── env.ts                    # 環境変数管理（Zod）
│
├── features/                     # 機能別モジュール
│   ├── auth/                     # 認証機能
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── index.ts
│   └── chat/                     # チャット機能
│       ├── components/
│       ├── hooks/
│       ├── store/
│       ├── types/
│       └── index.ts
│
├── lib/                          # ユーティリティ
│   ├── api-client.ts
│   ├── constants.ts
│   ├── query-client.ts
│   ├── socket.ts
│   └── utils.ts
│
├── providers/                    # React Providers
│   ├── index.tsx
│   ├── query-provider.tsx
│   └── theme-provider.tsx
│
├── types/                        # グローバル型定義
│   ├── api.ts
│   ├── chat.ts
│   ├── index.ts
│   └── user.ts
│
├── public/                       # 静的ファイル
│
├── .env.example                  # 環境変数テンプレート
├── .env                          # 環境変数 (Git 管理外)
├── .dockerignore
├── Dockerfile
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── yarn.lock
```

## 環境変数

### ファイル構成

| ファイル       | 用途                           | Git 管理 |
| -------------- | ------------------------------ | -------- |
| `.env.example` | テンプレート                   | Yes      |
| `.env`         | ローカル開発（Docker Compose） | No       |

### 変数一覧

| 変数名                     | 説明          | 開発環境の値          |
| -------------------------- | ------------- | --------------------- |
| `APP_ENV`                  | 環境          | `development`         |
| `NEXT_PUBLIC_API_BASE_URL` | API URL       | `http://backend:3000` |
| `NEXT_PUBLIC_WS_URL`       | WebSocket URL | `ws://backend:3000`   |
| `NEXT_PUBLIC_APP_VERSION`  | バージョン    | `docker-dev`          |

### 環境変数の管理

環境変数は `config/env.ts` で集中管理し、Zod でバリデーションします。

```typescript
// NG: 直接参照
const url = process.env.NEXT_PUBLIC_API_BASE_URL;

// OK: config/env.ts 経由
import { env } from '@/config/env';
const url = env.apiBaseUrl;
```

## 開発

### コード変更後のリビルド

```bash
cd /home/deploy/development

# リビルド＆再起動
docker compose build frontend && docker compose up frontend -d
```

### ローカル実行（Docker なし）

```bash
cd frontend

# 依存関係インストール
yarn install

# 開発サーバー起動（ポート 3001）
yarn dev
```

※ バックエンドが http://localhost:3000 で起動している必要があります

## スクリプト

| コマンド     | 説明                            |
| ------------ | ------------------------------- |
| `yarn dev`   | 開発サーバー起動（ポート 3001） |
| `yarn build` | 本番ビルド                      |
| `yarn start` | 本番サーバー起動（ポート 3001） |
| `yarn lint`  | ESLint 実行                     |

## アーキテクチャ

### Feature-based 構成

```
features/
├── auth/       # 認証機能
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── schemas/
│   └── types/
└── chat/       # チャット機能
    ├── components/
    ├── hooks/
    ├── store/
    └── types/
```

### 状態管理

| 種類             | 技術            | 用途           |
| ---------------- | --------------- | -------------- |
| サーバー状態     | TanStack Query  | API キャッシュ |
| クライアント状態 | Zustand         | UI 状態        |
| フォーム状態     | React Hook Form | 入力管理       |

## Docker

### マルチステージビルド

| ステージ | 説明                              |
| -------- | --------------------------------- |
| deps     | 依存関係インストール              |
| builder  | Next.js ビルド（standalone 出力） |
| runner   | 本番実行環境（非 root ユーザー）  |

### ポート設定

- **コンテナ内部**: 3000（Dockerfile デフォルト）
- **ホスト公開**: 3001（docker-compose.yml でマッピング）

### スタンドアロン出力

`next.config.ts` で `output: "standalone"` を設定し、最小イメージを生成。

## 関連ドキュメント

- `docs/10_implementation/frontend/` - 詳細設計書
