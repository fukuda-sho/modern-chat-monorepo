# Modern Realtime Chat Application

[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

リアルタイム通信機能を備えたモダンなチャットアプリケーションです。
Backend / Frontend をまとめた **モノレポ構成** で、Docker でローカル開発・本番デプロイが可能です。

---

## 目次

- [技術スタック](#技術スタック)
- [アーキテクチャ](#アーキテクチャ)
- [クイックスタート](#クイックスタートdocker-compose)
- [Makefile コマンド一覧](#makefile-コマンド一覧)
- [Backend](#backend)
- [Frontend](#frontend)
- [テスト](#テスト)
- [データベース](#データベース)
- [環境変数](#環境変数)
- [Docker / デプロイ](#docker--デプロイ)
- [開発ガイドライン](#開発ガイドライン)
- [トラブルシューティング](#トラブルシューティング)

---

## 技術スタック

### Backend

| 項目                   | 技術              | 備考                     |
| ---------------------- | ----------------- | ------------------------ |
| フレームワーク         | NestJS 11         | モジュラーアーキテクチャ |
| 言語                   | TypeScript 5      | strict mode              |
| ランタイム             | Node.js 22 LTS    | Alpine ベース            |
| ORM                    | Prisma 6          | 型安全なクエリ           |
| データベース           | MySQL 8           | InnoDB                   |
| 認証                   | JWT (Passport)    | Bearer Token             |
| リアルタイム通信       | Socket.IO 4       | WebSocket + Polling      |
| API ドキュメント       | Swagger/OpenAPI   | 自動生成                 |
| パッケージマネージャー | Yarn 4 (Corepack) | Zero-Install 非対応      |

### Frontend

| 項目                   | 技術                        | 備考                |
| ---------------------- | --------------------------- | ------------------- |
| フレームワーク         | Next.js 16                  | App Router          |
| UI ライブラリ          | React 19                    | Server Components   |
| 言語                   | TypeScript 5                | strict mode         |
| スタイリング           | Tailwind CSS v4 + shadcn/ui | CSS Variables       |
| 状態管理               | Zustand 5                   | クライアント状態    |
| データフェッチング     | TanStack Query 5            | サーバー状態        |
| フォーム               | React Hook Form + Zod       | バリデーション      |
| リアルタイム通信       | Socket.IO Client            | 自動再接続          |
| パッケージマネージャー | Yarn 4 (Corepack)           | Zero-Install 非対応 |

---

## アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │  Frontend   │    │   Backend   │    │       MySQL         │  │
│  │  (Next.js)  │───▶│  (NestJS)   │───▶│    (Database)       │  │
│  │   :3001     │    │    :3000    │    │      :3307          │  │
│  │             │◀───│             │    │                     │  │
│  │  WebSocket  │    │  Socket.IO  │    │  chat_app_db        │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                   │
         ▼                   ▼
    localhost:3001      localhost:3000
      (Browser)          (API/WS)
```

### プロジェクト構成

```bash
.
├── backend/                  # NestJS API サーバー
│   ├── src/
│   │   ├── auth/             # 認証モジュール
│   │   ├── chat/             # チャット (WebSocket)
│   │   ├── users/            # ユーザー管理
│   │   ├── prisma/           # Prisma サービス
│   │   ├── config/           # 環境変数 (Zod)
│   │   └── health/           # ヘルスチェック
│   ├── prisma/
│   │   └── schema.prisma     # DB スキーマ
│   └── Dockerfile            # マルチステージビルド
│
├── frontend/                 # Next.js フロントエンド
│   ├── app/                  # App Router
│   │   ├── (auth)/           # 認証ページ群
│   │   └── (main)/           # メインアプリ
│   ├── components/           # 共通 UI コンポーネント
│   ├── features/             # 機能別モジュール
│   │   ├── auth/             # 認証機能
│   │   └── chat/             # チャット機能
│   ├── lib/                  # ユーティリティ
│   └── Dockerfile            # マルチステージビルド
│
├── docs/                     # ドキュメント
│   ├── 00_planning/          # 設計・企画
│   ├── 10_implementation/    # 実装仕様
│   └── 20_decisions/         # 技術決定 (ADR)
│
├── docker-compose.yml        # 開発環境定義
└── Makefile                  # 開発コマンド集
```

---

## クイックスタート（Docker Compose）

### 前提条件

- Docker Desktop または Docker Engine + Compose v2
- Git

### 30 秒で起動

```bash
# 1. クローン
git clone <repository-url> && cd <project-directory>

# 2. 環境変数（デフォルト値で動作）
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. 起動（初回は数分かかります）
make up

# 4. マイグレーション
make migrate
```

### アクセス

| サービス   | URL                       | 説明             |
| ---------- | ------------------------- | ---------------- |
| Frontend   | http://localhost:3001     | チャットアプリ   |
| Backend    | http://localhost:3000     | REST API         |
| Swagger UI | http://localhost:3000/api | API ドキュメント |
| MySQL      | localhost:3307            | DB 直接接続      |

### ポート構成

| サービス | ホスト | コンテナ | 用途            |
| -------- | ------ | -------- | --------------- |
| Frontend | 3001   | 3000     | Next.js         |
| Backend  | 3000   | 3000     | NestJS API + WS |
| MySQL    | 3307   | 3306     | データベース    |

---

## Makefile コマンド一覧

`make help` で全コマンドを確認できます。

### 基本操作

| コマンド       | 説明                             |
| -------------- | -------------------------------- |
| `make up`      | 全サービス起動                   |
| `make down`    | 全サービス停止                   |
| `make restart` | 全サービス再起動                 |
| `make ps`      | コンテナ状態確認                 |
| `make logs`    | 全サービスのログ表示             |
| `make clean`   | コンテナ・ボリューム削除（注意） |

### ログ確認

| コマンド             | 説明          |
| -------------------- | ------------- |
| `make logs`          | 全サービス    |
| `make logs-backend`  | Backend のみ  |
| `make logs-frontend` | Frontend のみ |

### データベース

| コマンド        | 説明                    |
| --------------- | ----------------------- |
| `make migrate`  | Prisma マイグレーション |
| `make studio`   | Prisma Studio 起動      |
| `make generate` | Prisma クライアント生成 |
| `make shell-db` | MySQL CLI 接続          |

### ビルド

| コマンド       | 説明                   |
| -------------- | ---------------------- |
| `make build`   | イメージビルド         |
| `make rebuild` | キャッシュなしリビルド |

### テスト

| コマンド                      | 説明                      |
| ----------------------------- | ------------------------- |
| `make test`                   | Backend + Frontend 全実行 |
| `make test-backend`           | Backend 単体テスト        |
| `make test-backend-watch`     | Backend ウォッチモード    |
| `make test-backend-coverage`  | Backend カバレッジ        |
| `make test-frontend`          | Frontend 単体テスト       |
| `make test-frontend-watch`    | Frontend ウォッチモード   |
| `make test-frontend-coverage` | Frontend カバレッジ       |

### シェルアクセス

| コマンド              | 説明                    |
| --------------------- | ----------------------- |
| `make shell-backend`  | Backend コンテナに接続  |
| `make shell-frontend` | Frontend コンテナに接続 |

---

## Backend

### WebSocket イベント

**Client → Server**

| イベント      | ペイロード                            | 説明           |
| ------------- | ------------------------------------- | -------------- |
| `joinRoom`    | `{ roomId: number }`                  | ルーム参加     |
| `leaveRoom`   | `{ roomId: number }`                  | ルーム退出     |
| `sendMessage` | `{ roomId: number, content: string }` | メッセージ送信 |

**Server → Client**

| イベント         | ペイロード                                   | 説明           |
| ---------------- | -------------------------------------------- | -------------- |
| `roomJoined`     | `{ roomId: number }`                         | 参加完了       |
| `roomLeft`       | `{ roomId: number }`                         | 退出完了       |
| `messageCreated` | `{ id, roomId, userId, content, createdAt }` | 新規メッセージ |
| `error`          | `{ message: string }`                        | エラー通知     |

**接続例**

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: `Bearer ${accessToken}` },
});

// ルーム参加
socket.emit('joinRoom', { roomId: 1 });

// メッセージ送信
socket.emit('sendMessage', { roomId: 1, content: 'Hello!' });

// メッセージ受信
socket.on('messageCreated', (message) => {
  console.log('New message:', message);
});

// エラーハンドリング
socket.on('error', (err) => {
  console.error('Socket error:', err.message);
});
```

### Backend スクリプト

```bash
yarn build            # TypeScript ビルド
yarn start:dev        # 開発モード（ホットリロード）
yarn start:prod       # 本番モード
yarn test             # 単体テスト
yarn test:watch       # テスト（ウォッチ）
yarn test:coverage    # カバレッジレポート
yarn lint             # ESLint
yarn format           # Prettier
yarn prisma:generate  # Prisma クライアント生成
yarn prisma:migrate   # マイグレーション実行
yarn prisma:studio    # Prisma Studio（GUI）
```

---

## Frontend

### Feature-based アーキテクチャ

```
features/
├── auth/                 # 認証機能
│   ├── api/              # API 呼び出し
│   ├── components/       # UI コンポーネント
│   ├── hooks/            # カスタムフック
│   ├── schemas/          # Zod スキーマ
│   └── types/            # 型定義
│
└── chat/                 # チャット機能
    ├── components/       # UI コンポーネント
    ├── hooks/            # カスタムフック
    ├── store/            # Zustand ストア
    └── types/            # 型定義
```

### 状態管理の役割分担

| 種類             | 技術            | 用途                       |
| ---------------- | --------------- | -------------------------- |
| サーバー状態     | TanStack Query  | API データ / キャッシュ    |
| クライアント状態 | Zustand         | UI 状態 / 選択中ルームなど |
| フォーム状態     | React Hook Form | 入力値 / バリデーション    |

### Frontend スクリプト

```bash
yarn dev            # 開発サーバー（:3001）
yarn build          # 本番ビルド（standalone）
yarn start          # 本番サーバー
yarn lint           # ESLint
yarn format         # Prettier
yarn test           # Vitest 単体テスト
yarn test:watch     # テスト（ウォッチ）
yarn test:coverage  # カバレッジレポート
```

---

## テスト

### テスト環境

| サービス | ツール                         | 実行方法             |
| -------- | ------------------------------ | -------------------- |
| Backend  | Jest + @nestjs/testing         | `make test-backend`  |
| Frontend | Vitest + React Testing Library | `make test-frontend` |

### 全テスト実行

```bash
make test
```

### Backend テスト

```bash
make test-backend           # 単体テスト
make test-backend-watch     # ウォッチモード
make test-backend-coverage  # カバレッジ
```

| テストファイル            | テスト数 |
| ------------------------- | -------- |
| `auth.service.spec.ts`    | 6        |
| `auth.controller.spec.ts` | 2        |
| **合計**                  | **8**    |

### Frontend テスト

```bash
make test-frontend          # 単体テスト
make test-frontend-watch    # ウォッチモード
make test-frontend-coverage # カバレッジ
```

テストファイルはソースと同階層に `*.test.ts(x)` で配置（Co-located tests）。

| テストファイル            | テスト数 |
| ------------------------- | -------- |
| `chat-store.test.ts`      | 11       |
| `login-form.test.tsx`     | 8        |
| `signup-form.test.tsx`    | 9        |
| `message-input.test.tsx`  | 6        |
| `room-list.test.tsx`      | 5        |
| `room-item.test.tsx`      | 5        |
| `use-chat-socket.test.ts` | 11       |
| `utils.test.ts`           | 15       |
| `api-client.test.ts`      | 13       |
| **合計**                  | **83**   |

---

## 環境変数

### Backend (`backend/.env`)

| 変数名           | 説明           | デフォルト値                             |
| ---------------- | -------------- | ---------------------------------------- |
| `APP_ENV`        | 環境           | `development`                            |
| `APP_LOG_LEVEL`  | ログレベル     | `debug`                                  |
| `BACKEND_PORT`   | サーバーポート | `3000`                                   |
| `DATABASE_URL`   | MySQL 接続 URL | `mysql://chat_user:...@db:3306/chat_app` |
| `JWT_SECRET`     | JWT 署名キー   | （要設定）                               |
| `JWT_EXPIRES_IN` | JWT 有効期限   | `1h`                                     |

```bash
# 例
APP_ENV=development
APP_LOG_LEVEL=debug
BACKEND_PORT=3000
DATABASE_URL=mysql://chat_user:chat_password@db:3306/chat_app
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=1h
```

### Frontend (`frontend/.env`)

| 変数名                     | 説明          | デフォルト値          |
| -------------------------- | ------------- | --------------------- |
| `APP_ENV`                  | 環境          | `development`         |
| `NEXT_PUBLIC_API_BASE_URL` | API URL       | `http://backend:3000` |
| `NEXT_PUBLIC_WS_URL`       | WebSocket URL | `ws://backend:3000`   |
| `NEXT_PUBLIC_APP_VERSION`  | バージョン    | `local`               |

```bash
# 例
APP_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://backend:3000
NEXT_PUBLIC_WS_URL=ws://backend:3000
NEXT_PUBLIC_APP_VERSION=docker-dev
```

> **Note**: 環境変数は各サービスの `config/env.ts` で Zod によりバリデーションされます。

---

## Docker / デプロイ

### マルチステージビルド

**Backend Dockerfile**

| ステージ  | 用途                        |
| --------- | --------------------------- |
| `base`    | Node.js + Corepack 共通設定 |
| `dev`     | 開発用（`yarn start:dev`）  |
| `builder` | TypeScript ビルド           |
| `runner`  | 本番起動（最小イメージ）    |

**Frontend Dockerfile**

| ステージ  | 用途                              |
| --------- | --------------------------------- |
| `deps`    | 依存関係インストール              |
| `builder` | Next.js ビルド（standalone 出力） |
| `runner`  | 本番起動（非 root ユーザー）      |

### 本番イメージビルド

```bash
# Backend
docker build -t chat-backend:latest ./backend

# Frontend
docker build -t chat-frontend:latest ./frontend
```

### 本番環境チェックリスト

- [ ] `JWT_SECRET` を強力なランダム文字列に変更
- [ ] `APP_ENV=production` に設定
- [ ] HTTPS/WSS を使用（リバースプロキシ経由）
- [ ] MySQL のバックアップ・レプリケーション設定
- [ ] 環境変数は CI/CD から安全に注入
- [ ] rate limiting の検討
- [ ] ログの外部転送設定

---

## 開発ガイドライン

### コーディング規約

| 項目               | ルール                         |
| ------------------ | ------------------------------ |
| TypeScript         | strict mode, `any` 禁止        |
| ファイル命名       | kebab-case (`auth.service.ts`) |
| コンポーネント命名 | PascalCase (`LoginForm.tsx`)   |
| インポート順序     | 外部 → 内部 → 相対パス         |
| フォーマット       | Prettier（保存時自動整形）     |
| リント             | ESLint（エラーは即修正）       |

### 環境変数追加手順

1. `.env.example` にキーを追加
2. `config/env.ts` のスキーマを更新
3. `.env` に実際の値を設定
4. コード内で `env.xxx` として参照

### Git コミット規約

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: フォーマット変更（動作に影響なし）
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・補助ツール変更
```

---

## トラブルシューティング

### コンテナが起動しない

```bash
# ログ確認
docker compose logs -f

# コンテナ状態
docker compose ps

# 完全リセット
make clean && make up
```

### DB 接続エラー

```bash
# DB ログ確認
docker compose logs db

# DB が起動しているか確認
docker compose exec db mysqladmin ping -h localhost -u root -prootpassword
```

### Prisma クライアントエラー

```bash
# クライアント再生成
make generate

# マイグレーションやり直し
make migrate
```

### ポートが使用中

```bash
# 使用中のプロセス確認
lsof -i :3000
lsof -i :3001
lsof -i :3307

# 強制終了（必要に応じて）
kill -9 <PID>
```

### ビルドキャッシュの問題

```bash
# キャッシュなしリビルド
make rebuild

# Docker システム全体のクリーンアップ（注意）
docker system prune -a
```

### Frontend の環境変数が反映されない

```bash
# コンテナ再ビルド
docker compose build frontend
docker compose up -d frontend
```

---

## 詳細ドキュメント

| ディレクトリ              | 内容                   |
| ------------------------- | ---------------------- |
| `docs/00_planning/`       | 設計・企画ドキュメント |
| `docs/10_implementation/` | 実装仕様書             |
| `docs/20_decisions/`      | 技術選定・ADR          |
| `backend/README.md`       | Backend 詳細           |
| `frontend/README.md`      | Frontend 詳細          |

---

## ライセンス

Private
