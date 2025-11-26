# Modern Realtime Chat Application

リアルタイム通信機能を備えたモダンなチャットアプリケーションです。モノレポ構造で構築されています。

## 技術スタック

### Backend

| 項目 | 技術 |
|------|------|
| フレームワーク | NestJS 11 |
| 言語 | TypeScript 5 |
| ランタイム | Node.js 22 |
| ORM | Prisma 6 |
| データベース | MySQL 8 |
| 認証 | JWT (Passport) |
| リアルタイム通信 | Socket.IO 4 |
| API ドキュメント | Swagger |
| パッケージマネージャー | Yarn 4 (Corepack) |

### Frontend

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 16 |
| UI ライブラリ | React 19 |
| 言語 | TypeScript 5 |
| スタイリング | Tailwind CSS v4 + shadcn/ui |
| 状態管理 | Zustand 5 |
| データフェッチング | TanStack Query 5 |
| フォーム | React Hook Form + Zod |
| リアルタイム通信 | Socket.IO Client |
| パッケージマネージャー | Yarn 4 (Corepack) |

## プロジェクト構成

```
.
├── backend/          # NestJS API サーバー
│   ├── src/          # ソースコード
│   ├── prisma/       # Prisma スキーマ・マイグレーション
│   └── Dockerfile    # マルチステージビルド対応
├── frontend/         # Next.js フロントエンド
│   ├── app/          # App Router
│   ├── components/   # UI コンポーネント
│   ├── features/     # 機能別モジュール
│   └── Dockerfile    # マルチステージビルド対応
├── docs/             # プロジェクトドキュメント
│   ├── 00_planning/      # 設計・企画ドキュメント
│   ├── 10_implementation/ # 実装ドキュメント
│   └── 20_decisions/     # 技術選定・決定事項
└── docker-compose.yml
```

## クイックスタート (Docker Compose)

### 前提条件

- Docker Desktop または Docker Engine
- Docker Compose v2

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. 環境変数ファイルを準備

```bash
# Backend 用（Docker 用は設定済み）
cp backend/.env.example backend/.env.docker  # 必要に応じて

# Frontend 用（Docker 用は設定済み）
cp frontend/.env.example frontend/.env.docker  # 必要に応じて
```

> **Note**: `.env.docker` ファイルはデフォルト値で動作するよう設定されています。

### 3. 開発環境を起動

```bash
# 全サービスを起動（初回はビルドに数分かかります）
docker compose up -d

# ログを確認
docker compose logs -f
```

### 4. データベースのセットアップ

```bash
# コンテナに入ってマイグレーションを実行
docker compose exec backend yarn prisma:migrate
```

### 5. アクセス

| サービス | URL | 説明 |
|----------|-----|------|
| Frontend | http://localhost:3001 | チャットアプリ UI |
| Backend API | http://localhost:3000 | REST API エンドポイント |
| Swagger UI | http://localhost:3000/api | API ドキュメント |

## ローカル開発 (Docker なし)

### 前提条件

- Node.js 22 LTS
- Yarn (Corepack で自動有効化)
- MySQL 8.0

### 1. パッケージマネージャーを有効化

```bash
corepack enable
```

### 2. Backend のセットアップ

```bash
cd backend

# 依存関係をインストール
yarn install

# 環境変数を設定
cp .env.example .env.development

# DATABASE_URL を編集（ローカル MySQL に合わせる）
# DATABASE_URL="mysql://user:password@localhost:3307/chat_app"

# Prisma クライアントを生成
yarn prisma:generate

# データベースマイグレーション
yarn prisma:migrate

# 開発サーバーを起動（ホットリロード付き）
yarn start:dev
```

### 3. Frontend のセットアップ

```bash
cd frontend

# 依存関係をインストール
yarn install

# 環境変数を設定
cp .env.example .env.local

# 以下の環境変数を編集（ローカルホスト用）
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
# NEXT_PUBLIC_WS_URL=ws://localhost:3000

# 開発サーバーを起動
yarn dev
```

## ポート構成

| サービス | ホスト側ポート | コンテナ内ポート |
|----------|---------------|-----------------|
| Frontend | 3001 | 3000 |
| Backend | 3000 | 3000 |
| MySQL | 3307 | 3306 |

## よく使うコマンド

### Docker Compose

```bash
# 全サービス起動
docker compose up -d

# 全サービス停止
docker compose down

# 特定のサービスのログを確認
docker compose logs -f backend
docker compose logs -f frontend

# コンテナを再ビルド（Dockerfile 変更時）
docker compose up -d --build

# ボリュームごと削除（DB データもクリア）
docker compose down -v
```

### Backend

```bash
# 開発サーバー起動
yarn start:dev

# 本番ビルド
yarn build

# Prisma Studio（DB GUI）
yarn prisma:studio

# マイグレーション作成
yarn prisma:migrate

# リント
yarn lint

# フォーマット
yarn format
```

### Frontend

```bash
# 開発サーバー起動
yarn dev

# 本番ビルド
yarn build

# 本番サーバー起動
yarn start

# リント
yarn lint
```

## データベーススキーマ

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │     │  ChatRoom   │     │   Message   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ username    │     │ name        │     │ content     │
│ email       │     │ createdAt   │     │ userId   →─┼──→ User
│ password    │     └─────────────┘     │ chatRoomId→┼──→ ChatRoom
│ createdAt   │           ↑             │ createdAt   │
└─────────────┘           │             └─────────────┘
       ↑                  │                    │
       └──────────────────┴────────────────────┘
```

## 環境変数

### Backend (`backend/.env.docker` / `.env.development`)

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `APP_ENV` | 環境（development/production） | development |
| `APP_LOG_LEVEL` | ログレベル | debug |
| `BACKEND_PORT` | サーバーポート | 3000 |
| `DATABASE_URL` | MySQL 接続 URL | - |
| `JWT_SECRET` | JWT 署名キー | - |
| `JWT_EXPIRES_IN` | JWT 有効期限 | 1h |

### Frontend (`frontend/.env.docker` / `.env.local`)

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `APP_ENV` | 環境 | development |
| `NEXT_PUBLIC_API_BASE_URL` | API ベース URL | http://backend:3000 |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | ws://backend:3000 |
| `NEXT_PUBLIC_APP_VERSION` | アプリバージョン | local |

## 本番デプロイ

### Docker イメージのビルド

```bash
# Backend
docker build -t chat-backend ./backend

# Frontend
docker build -t chat-frontend ./frontend
```

本番環境では各 Dockerfile の `runner` ステージが使用され、最適化されたイメージが生成されます。

### 本番環境のポイント

- `JWT_SECRET` は強力なランダム文字列を使用
- 環境変数は CI/CD から安全に注入
- MySQL は適切なバックアップ・レプリケーション設定
- HTTPS/WSS を使用（リバースプロキシ設定）

## トラブルシューティング

### コンテナが起動しない

```bash
# ログを確認
docker compose logs -f

# コンテナの状態を確認
docker compose ps
```

### データベース接続エラー

```bash
# DB コンテナの状態を確認
docker compose exec db mysqladmin ping -h localhost -u root -prootpassword

# DB ログを確認
docker compose logs db
```

### ポートが既に使用されている

```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :3001
lsof -i :3307
```

## 詳細ドキュメント

- [Backend README](./backend/README.md) - API 仕様、アーキテクチャ詳細
- [Frontend README](./frontend/README.md) - コンポーネント設計、状態管理
- [設計ドキュメント](./docs/) - 技術選定、アーキテクチャ決定

## ライセンス

Private
