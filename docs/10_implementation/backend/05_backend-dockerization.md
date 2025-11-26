# 05. バックエンド Docker 化設計書（Node.js / backend）

## 0. ファイル情報

- パス: `docs/10_implementation/backend/05_backend-dockerization.md`
- 対象: バックエンドアプリケーション（`backend/` ディレクトリ配下）
- 目的: Node.js / TypeScript ベースのバックエンドを Docker コンテナとして実行・デプロイ可能にするための方針を定義する。

---

## 1. 目的・スコープ

### 1.1 目的

- `backend/` ディレクトリ配下の API / WebSocket サーバを、**単独で Docker コンテナとして実行**できるようにする。
- ローカル開発・ステージング・本番環境で、基本的に **同一 Dockerfile** を利用できるようにし、環境差異を最小限にする。
- フロントエンドは既存の仕組み（ホスト OS 上の別プロセスや別コンテナなど）を利用し、**この仕様ではバックエンドのコンテナ化のみにフォーカス**する。

### 1.2 スコープ

- **含まれるもの**
  - `backend/Dockerfile` の構成方針
  - Node.js / TypeScript / WebSocket を考慮したビルド・実行戦略
  - 既存の `/home/deploy/development/docker-compose.yml` に対してバックエンド用サービス定義を **有効化** する方針
  - 環境変数（DB 接続情報・JWT シークレット・ポートなど）の扱い方針

- **含まれないもの**
  - フロントエンドの Docker 化（`frontend/` 用 Dockerfile, compose 定義）
  - DB / Redis 等インフラコンポーネントの Docker 化
  - CI/CD パイプラインやクラウドインフラ（ECS / Kubernetes / Cloud Run 等）の具体設定

---

## 2. 前提・共通ポリシーとの整合

### 2.1 バックエンド技術スタック前提

- 言語: TypeScript（strict mode）
- ランタイム: Node.js 20 系（LTS）を想定
- フレームワーク: NestJS
- 構成:
  - HTTP API（REST）
  - WebSocket / Socket.io によるリアルタイム通信
- ビルド:
  - TypeScript → JavaScript にトランスパイルしてから実行（`dist/`）

### 2.2 共通ポリシーとの整合

この Docker 化設計でも、以下のプロジェクト共通ルールを維持する：

1. **パッケージマネージャ**
   - コンテナ内でも **`yarn`** を使用する（`npm` / `npx` は使用しない）。
   - `corepack enable` による Yarn 管理を前提とする。

2. **ESLint / Prettier**
   - Docker コンテナ上でもローカルと同じ Lint / Format 設定で動作可能とする。
   - 本番用イメージには Lint 実行は含めないが、CI では同一イメージを利用してチェック可能な構成を目指す。

3. **`any` 型禁止・型安全**
   - Docker 化はビルド・実行手段の変更であり、型安全ポリシーには影響を与えない。
   - TypeScript strict mode 前提でビルドが通ることをコンテナビルド成功条件とする。

---

## 3. コンテナ設計（バックエンド）

### 3.1 単一コンテナモデル

- 1 コンテナ = 1 バックエンドアプリ（`backend`）
- コンテナ内での役割:
  - 依存インストール（`yarn install`）
  - Prisma クライアント生成（`yarn prisma:generate`）
  - TypeScript ビルド（`yarn build`）
  - 本番起動（`yarn start:prod`）
- 公開ポート:
  - デフォルト: `3000`（環境変数 `BACKEND_PORT` で上書き可能）
  - HTTP / WebSocket を同一ポートで提供

### 3.2 フロントエンド / 他サービスとの接続

- フロントエンドからは、以下のような URL でアクセスする前提：
  - `http://backend:3000`（同一 `docker-compose.yml` 内の `frontend` サービスから）
  - `http://<ホスト名または ALB ドメイン>:3000`（本番）
- DB は別コンテナ（`db`）で動作しており、`DATABASE_URL` 環境変数で接続先を指定する。

---

## 4. Dockerfile 設計（backend）

### 4.1 ファイル配置

- ファイル: `backend/Dockerfile`
- 目的: バックエンドアプリをビルドし、本番実行可能な Node.js コンテナイメージを作成する。

### 4.2 マルチステージ構成

**方針:**

1. `builder` ステージ
   - 依存関係インストール（`yarn install`）
   - Prisma クライアント生成（`yarn prisma:generate`）
   - TypeScript ビルド（`yarn build`）を実行

2. `runner` ステージ
   - 必要な `node_modules` とビルド成果物（`dist/`）のみをコピー
   - `NODE_ENV=production` で起動

### 4.3 使用ベースイメージ

- すべてのステージで `node:20-alpine` 系を使用し、イメージサイズとビルド時間のバランスを取る。

### 4.4 Dockerfile 実装

```Dockerfile
# backend/Dockerfile
# マルチステージビルド: builder -> runner

# ============================================
# Builder ステージ
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Corepack を有効化して Yarn を使用
RUN corepack enable

# 依存関係ファイルをコピー
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# 依存関係をインストール
RUN yarn install --immutable

# Prisma スキーマをコピーしてクライアント生成
COPY prisma ./prisma
RUN yarn prisma:generate

# ソースコードをコピー
COPY tsconfig.json nest-cli.json ./
COPY src ./src

# TypeScript ビルド
RUN yarn build

# ============================================
# Runner ステージ
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Corepack を有効化
RUN corepack enable

# 本番環境設定
ENV NODE_ENV=production
ENV BACKEND_PORT=3000

# 依存関係ファイルをコピー
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# 本番依存のみインストール
RUN yarn workspaces focus --production && yarn cache clean

# Prisma クライアントをコピー
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# ビルド成果物をコピー
COPY --from=builder /app/dist ./dist

# ポートを公開
EXPOSE 3000

# アプリケーション起動
CMD ["yarn", "start:prod"]
```

---

## 5. docker-compose 利用方針

### 5.1 目的

- 既存の `/home/deploy/development/docker-compose.yml` に対して、バックエンド用サービス `backend` 定義を **有効化** する。
- フロントエンドや DB と同一ネットワーク上で動作させる。

### 5.2 docker-compose.yml の位置と前提

- 対象ファイル: `/home/deploy/development/docker-compose.yml`
- `build.context` は compose ファイルから見た相対パスで指定する。

### 5.3 サービス定義

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: chat_app_backend
    restart: unless-stopped
    env_file:
      - ./backend/.env.development
    environment:
      # Docker 内部ネットワークでの DB 接続設定
      DATABASE_URL: mysql://chat_user:chat_password@db:3306/chat_app
    ports:
      - '3000:3000'
    depends_on:
      db:
        condition: service_healthy
    networks:
      - chat_network
```

---

## 6. 環境変数・設定ファイル方針

### 6.1 `.env.*` ファイル

- `backend/.env.development`（ローカル開発・Docker 実行用）
- `backend/.env.example`（キーのみ記載するテンプレート）
- `.env.example` のみ Git 管理し、実際の `.env.*` は Git 管理しない。

### 6.2 代表的な環境変数

| 環境変数 | 説明 | デフォルト |
|---------|------|-----------|
| `APP_ENV` | 環境（development/staging/production） | development |
| `APP_LOG_LEVEL` | ログレベル | info |
| `BACKEND_PORT` | リッスンポート | 3000 |
| `DATABASE_URL` | DB 接続 URL | - |
| `JWT_SECRET` | JWT シークレット | - |
| `JWT_EXPIRES_IN` | JWT 有効期限 | 1h |

### 6.3 Docker 内での環境変数上書き

- `docker-compose.yml` の `environment` セクションで `DATABASE_URL` を上書きし、Docker ネットワーク内の DB ホスト名（`db`）を使用する。

---

## 7. ビルド・起動手順（バックエンド）

### 7.1 サーバ上での操作

1. `.env.development` の準備

```bash
cd /home/deploy/development/backend
cp .env.example .env.development
# 必要に応じて値を編集
```

2. イメージビルド & 起動

```bash
cd /home/deploy/development

# backend サービスのビルド
docker compose build backend

# backend サービスの起動
docker compose up backend -d

# ログ確認
docker compose logs -f backend
```

3. 動作確認

```bash
# ヘルスチェック
curl http://localhost:3000/health

# API ドキュメント
open http://localhost:3000/api/docs
```

### 7.2 全サービス起動

```bash
docker compose up -d
```

---

## 8. ToDo

- [x] `backend/Dockerfile` を作成
- [x] `backend/.dockerignore` を作成
- [x] `docker-compose.yml` の backend サービスを有効化
- [ ] Docker ビルド・起動テスト
- [ ] CI/CD パイプラインでの Docker イメージビルド設定
