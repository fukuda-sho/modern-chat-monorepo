# 06. フロントエンド Docker 化設計書（Next.js / frontend）

## 0. ファイル情報

- パス: `docs/10_implementation/frontend/06_frontend-dockerization.md`
- 対象: フロントエンドアプリケーション（`frontend/` ディレクトリ配下）
- 目的: Next.js ベースのフロントエンドを Docker コンテナとして実行・デプロイ可能にするための方針を定義する。

---

## 1. 目的・スコープ

### 1.1 目的

- `frontend/` ディレクトリ配下の Next.js アプリを、**単独で Docker コンテナとして実行**できるようにする。
- ローカル開発・ステージング・本番環境で、基本的に **同一 Dockerfile** を利用できるようにし、環境差異を最小限にする。
- バックエンドは既存の仕組み（ホスト OS 上のプロセスや別コンテナなど）を利用し、**この仕様ではフロントエンドのコンテナ化のみにフォーカス**する。

### 1.2 スコープ

- **含まれるもの**
  - `frontend/Dockerfile` の構成方針
  - Next.js 16 / React 19 / Tailwind CSS v4 を考慮したビルド・実行戦略（`output: "standalone"` 前提）
  - 既存の `/home/deploy/development/docker-compose.yml` に対して
    フロントエンド用サービス定義を **追記** する方針
  - 環境変数（API ベース URL 等）の扱い方針

- **含まれないもの**
  - バックエンドの Docker 化（`backend/` 用 Dockerfile, compose 定義）
  - DB / Redis 等のインフラコンポーネントの Docker 化
  - CI/CD パイプラインやクラウドインフラ（ECS / Kubernetes / Cloud Run 等）の具体設定

---

## 2. 前提・共通ポリシーとの整合

### 2.1 フロントエンド技術スタック前提

- フレームワーク: Next.js 16 (App Router)
- 言語: TypeScript（strict mode）
- ランタイム: Node.js 20 系（LTS）を想定
- UI / デザイン:
  - Tailwind CSS v4
  - shadcn/ui（Radix UI ベース）
- 状態管理:
  - Zustand（クライアント状態）
  - TanStack Query v5（サーバ状態）

### 2.2 共通ポリシーとの整合

この Docker 化設計でも、以下のプロジェクト共通ルールを維持する：

1. **パッケージマネージャ**
   - コンテナ内でも **`yarn`** を使用する（`npm` / `npx` は使用しない）。
   - `corepack enable` による Yarn 管理を前提とする。

2. **ESLint / Prettier**
   - Docker コンテナ上でもローカルと同じ Lint / Format 設定で動作可能とする。
   - 本番用イメージには Lint 実行は含めないが、CI では同一イメージを利用してチェック可能な構成を目指す。

3. **JSDoc**
   - コンポーネント・カスタムフック・主要なユーティリティ関数では、必要に応じて JSDoc コメントを維持する（Docker 化による変更は不要）。

4. **ファイル命名規則**
   - `kebab-case` など既存の命名規則を維持し、Docker 化のためにファイル名を変更しない。

5. **`any` 型禁止・型安全**
   - Docker 化はビルド・実行手段の変更であり、型安全ポリシーには影響を与えない。
   - TypeScript strict mode 前提でビルドが通ることをコンテナビルド成功条件とする。

---

## 3. コンテナ設計（フロントエンド）

### 3.1 単一コンテナモデル

- 1 コンテナ = 1 Next.js アプリ（`frontend`）
- コンテナ内での役割:
  - 依存インストール（`yarn install`）
  - ビルド（`yarn build`）
  - 本番起動（`node server.js` : Next.js standalone 出力）
- 公開ポート:
  - デフォルト: `3001`（環境変数 `PORT` で上書き可能）

### 3.2 バックエンドとの接続

- バックエンドの URL は、環境変数を通じて指定：
  - 例: `NEXT_PUBLIC_API_BASE_URL=http://backend:3000`
- 開発コンテナからバックエンドにアクセスするケースでは、既存 compose の設計に合わせて以下のいずれかを採用する：
  - 同一 `docker-compose.yml` 内の別サービス（例: `backend`）に対して `http://backend:3000` で接続
  - ホスト OS 上のバックエンドに対して `http://host.docker.internal:3000` で接続（必要に応じて）

---

## 4. Dockerfile 設計（Next.js 16 / frontend）

### 4.1 ファイル配置

- ファイル: `frontend/Dockerfile`
- 目的: フロントエンドアプリをビルドし、本番実行可能な Node.js コンテナイメージを作成する。

### 4.2 マルチステージ構成

**方針:**

1. `deps` ステージ
   - `yarn install` の実行（依存関係の解決）

2. `builder` ステージ
   - `deps` ステージから `node_modules` をコピー
   - アプリ本体をコピーして `yarn build` 実行
   - `next.config.ts` で `output: "standalone"` を指定しておく

3. `runner` ステージ
   - `builder` ステージから `.next/standalone` / `.next/static` / `public` など必要な成果物のみをコピー
   - `NODE_ENV=production` で起動
   - 非 root ユーザー（`nextjs`）で実行

### 4.3 使用ベースイメージ

- すべてのステージで `node:20-alpine` 系を使用し、イメージサイズとビルド時間のバランスを取る。

### 4.4 Dockerfile の実装

```Dockerfile
# frontend/Dockerfile
# Next.js 16 / React 19 / Tailwind CSS v4 フロントエンドのマルチステージビルド

# ==============================================================================
# Stage 1: deps - 依存関係のインストール
# ==============================================================================
FROM node:20-alpine AS deps
WORKDIR /app

# Yarn の有効化（Corepack 経由）
RUN corepack enable

# 依存関係ファイルをコピー
COPY package.json yarn.lock .yarnrc.yml ./

# 依存関係のインストール（frozen-lockfile で再現性を保証）
RUN yarn install --immutable

# ==============================================================================
# Stage 2: builder - アプリケーションのビルド
# ==============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Yarn の有効化
RUN corepack enable

# deps ステージから node_modules をコピー
COPY --from=deps /app/node_modules ./node_modules

# アプリケーションソースをコピー
COPY . .

# Next.js の匿名テレメトリを無効化
ENV NEXT_TELEMETRY_DISABLED=1

# ビルド実行（next.config.ts で output: "standalone" が設定済み）
RUN yarn build

# ==============================================================================
# Stage 3: runner - 本番実行環境
# ==============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# セキュリティのため非 root ユーザーを作成
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 本番環境設定
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# standalone 出力からビルド成果物をコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 非 root ユーザーに切り替え
USER nextjs

# ポート公開
EXPOSE 3001

# Next.js standalone サーバーの起動
CMD ["node", "server.js"]
```

---

## 5. docker-compose 利用方針

### 5.1 目的

* 既存の `/home/deploy/development/docker-compose.yml` に対して、
  フロントエンド用サービス `frontend` 定義を **追記** する。
* 既存の `db` / 将来の `backend` などと同一ネットワーク上で動作させる。

### 5.2 docker-compose.yml の位置と前提

* 対象ファイル: `/home/deploy/development/docker-compose.yml`
* `build.context` は compose ファイルから見た相対パスで指定する。

### 5.3 サービス定義

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: chat_app_frontend
    restart: unless-stopped
    env_file:
      - ./frontend/.env.docker
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:3000
      NEXT_PUBLIC_WS_URL: ws://backend:3000
    ports:
      - '3001:3001'
    depends_on:
      - db
      # backend サービスが有効化されたら以下に変更
      # - backend
    networks:
      - chat_network
```

---

## 6. 環境変数・設定ファイル方針

### 6.1 `.env.*` ファイル

* フロントエンド用の環境変数ファイル:
  * `frontend/.env.example`（テンプレート）
  * `frontend/.env.development`（ローカル開発・ホスト実行用）
  * `frontend/.env.local`（非 Docker ローカル開発用）
  * `frontend/.env.docker`（docker-compose から参照）
  * `frontend/.env.production`（本番向け）

### 6.2 代表的な環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_API_BASE_URL` | バックエンド API のベース URL | `http://backend:3000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket 接続用 URL | `ws://backend:3000` |
| `NEXT_PUBLIC_APP_VERSION` | アプリバージョン表示用 | `docker-local` |
| `NODE_ENV` | 実行環境 | `production` |
| `PORT` | リッスンポート | `3001` |

### 6.3 ルール

* シークレット（API トークンなど）は `.env.*` を Git 管理しない、または `.env.example` を用意して実値は各環境で設定。
* 本番環境では、CI/CD ツールのシークレット機能から環境変数として注入する。

---

## 7. ビルド・起動手順（フロントエンド）

### 7.1 サーバ上（/home/deploy/development）での操作

1. `.env.docker` の準備
   ```bash
   # 既に作成済みの場合はスキップ
   cp frontend/.env.example frontend/.env.docker
   # 必要に応じて編集
   ```

2. イメージビルド & 起動
   ```bash
   cd /home/deploy/development

   # frontend サービスを含めたビルド
   docker compose build frontend

   # frontend サービスの起動
   docker compose up frontend -d

   # ログ確認
   docker compose logs -f frontend
   ```

3. ブラウザアクセス
   * http://<サーバのホスト名またはIP>:3001

### 7.2 スタンドアロンでのビルド（CI/レジストリ用）

```bash
cd frontend
docker build -t chat-frontend:latest .
docker run -p 3001:3001 --env-file .env.docker chat-frontend:latest
```

---

## 8. 実装成果物

本設計書に基づき、以下のファイルが実装された：

| ファイル | 説明 |
|----------|------|
| `frontend/Dockerfile` | マルチステージビルド用 Dockerfile |
| `frontend/.dockerignore` | Docker ビルド時の除外設定 |
| `frontend/.env.docker` | Docker Compose 用環境変数ファイル |
| `frontend/next.config.ts` | `output: "standalone"` 設定追加 |
| `docker-compose.yml` | frontend サービス定義追加 |

---

## 9. 今後の ToDo

- [ ] バックエンド Dockerfile 完成後、`depends_on` を `backend` に変更
- [ ] CI/CD パイプラインでのイメージビルド・プッシュ設定
- [ ] 本番環境向け `.env.production` の整備
- [ ] ヘルスチェックエンドポイントの追加検討
