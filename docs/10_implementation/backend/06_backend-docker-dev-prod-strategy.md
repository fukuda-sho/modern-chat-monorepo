# 06. バックエンド Docker dev / prod 分離設計書（NestJS / backend）

## 0. ファイル情報

- パス: `docs/10_implementation/backend/06_backend-docker-dev-prod-strategy.md`
- 対象: バックエンドアプリケーション（`backend/` ディレクトリ配下）
- 目的: NestJS ベースのバックエンドを Docker コンテナとして実行する際に、**開発用（dev）** と **本番用（prod）** を明確に分離しつつ、単一の Dockerfile / compose 構成で運用できるようにする方針を定義する。

---

## 1. 目的・スコープ

### 1.1 目的

- `backend/` ディレクトリ配下の NestJS アプリを、
  - 開発環境では `yarn start:dev` によるホットリロード（Nest CLI）付きで、
  - 本番環境では `yarn build` → `node dist/main.js` によるビルド済み実行で、
  実行できるようにする。
- Dockerfile は **1 ファイル** に統一し、multi-stage / multi-target によって dev / prod を切り替える。
- 既存の `/home/deploy/development/docker-compose.yml` における `backend` サービス定義から dev 用コンテナを起動し、本番は CI によるビルド済みイメージを AWS 上で起動する前提とする。

### 1.2 スコープ

- **含まれるもの**
  - `backend/Dockerfile` の dev / prod 対応方針（multi-stage / multi-target）
  - `/home/deploy/development/docker-compose.yml` における `backend` サービス定義の dev 用設定方針
  - 開発環境での `yarn start:dev` 運用と、本番環境でのビルド済みイメージ運用の切り分け

- **含まれないもの**
  - フロントエンド / DB / Redis 等の Docker 化詳細および本番インフラ（AWS ECS / ALB / RDS 等）の具体設定
  - 環境変数の詳細設計（別ドキュメント：環境変数管理指示書 / DB 用シークレット指示書に委譲）

---

## 2. 前提・共通ポリシーとの整合

### 2.1 バックエンド技術スタック前提

- フレームワーク: NestJS
- 言語: TypeScript（strict mode, `any` 禁止）
- ランタイム: Node.js 20 系（LTS）
- 起動コマンド:
  - 開発: `yarn start:dev`（Nest CLI のホットリロード）
  - 本番ビルド: `yarn build`
  - 本番起動: `yarn start:prod` または `node dist/main.js`
- ポート:
  - デフォルト: `3000`（環境変数 `BACKEND_PORT` または `PORT` で上書き可能）

### 2.2 共通ポリシーとの整合

- パッケージマネージャ: `yarn`（`npm` / `npx` は使用しない）
- ESLint / Prettier / JSDoc / ファイル命名規則 / 型安全性ポリシーは既存ルールに従う。
- Docker 化はあくまで「実行手段の変化」であり、これらの品質ルールには影響を与えない。

---

## 3. Dockerfile 設計方針（dev / prod 共通）

### 3.1 役割分割

`backend/Dockerfile` は、以下のような **multi-stage 構成** とする。

1. `base` ステージ
   - Node.js 20 / `corepack enable` / `WORKDIR /app` など基本設定を共通化。

2. `dev` ステージ（開発専用ターゲット）
   - `NODE_ENV=development`
   - `yarn install` を実行。
   - 開発用 `CMD ["yarn", "start:dev"]` とし、ソースコードは docker-compose から volume mount する。

3. `builder` ステージ（本番ビルド）
   - 依存インストール（`yarn install`）と TypeScript ビルド（`yarn build`）を実行。
   - `dist/` ディレクトリにビルド成果物を出力する前提。

4. `runner` ステージ（本番実行用）
   - 必要な runtime 依存のみインストール。
   - `dist/` をコピーして `NODE_ENV=production` で実行 (`node dist/main.js` など)。

### 3.2 Dockerfile 実装

```dockerfile
# backend/Dockerfile
# マルチステージビルド: base -> dev / builder -> runner

# ============================================
# Base ステージ（共通設定）
# ============================================
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

# ============================================
# Dev ステージ（開発環境）
# ============================================
FROM base AS dev
ENV NODE_ENV=development

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

COPY prisma ./prisma
RUN yarn prisma:generate

# 開発時はソースは volume mount 想定
EXPOSE 3000
CMD ["yarn", "start:dev"]

# ============================================
# Builder ステージ（本番ビルド）
# ============================================
FROM base AS builder
# NODE_ENV は設定しない（devDependencies が必要なため）

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

COPY prisma ./prisma
RUN yarn prisma:generate

COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN yarn build

# ============================================
# Runner ステージ（本番実行）
# ============================================
FROM base AS runner
ENV NODE_ENV=production
ENV BACKEND_PORT=3000

# wget インストール（HEALTHCHECK 用）
RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# builder から node_modules をコピー（.prisma 含む、再インストール不要）
COPY --from=builder /app/node_modules ./node_modules
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY package.json ./

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# node 直接実行（シグナルハンドリング最適化）
CMD ["node", "dist/main.js"]
```

### 3.3 ベストプラクティスのポイント

| 項目 | 実装 |
|------|------|
| builder で NODE_ENV 未設定 | devDependencies（TypeScript 等）が必要なため |
| runner で再インストールしない | builder から node_modules をコピーしてビルド時間短縮 |
| wget インストール | alpine には wget がないため HEALTHCHECK 用に追加 |
| node 直接実行 | シグナル（SIGTERM）の正確な伝播、グレースフルシャットダウン対応 |

---

## 4. 開発環境（dev）での利用方針

### 4.1 docker-compose 側での設定（開発用 backend）

`/home/deploy/development/docker-compose.yml` における `backend` サービスは、開発用途では以下のように構成する。

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
    target: dev                    # ← dev ターゲットを指定
  container_name: chat_app_backend
  restart: unless-stopped
  env_file:
    - ./backend/.env.docker
  ports:
    - "3000:3000"
  depends_on:
    db:
      condition: service_healthy
  networks:
    - chat_network
  volumes:
    - ./backend:/app               # ローカルソースをコンテナにマウント
    - /app/node_modules            # node_modules はコンテナ側を優先
```

### 4.2 開発時の動作イメージ

1. 開発者は `/home/deploy/development` で以下を実行：

   ```bash
   docker compose up backend
   # or
   docker compose up -d backend
   ```

2. コンテナ内で `yarn start:dev` が起動し、NestJS の dev サーバがポート 3000 をリッスン。

3. `./backend` 以下のソースコードを編集すると、volume mount によりコンテナ内からも即時変更が見え、Nest CLI のホットリロードが動作する。

---

## 5. 本番環境（prod）での利用方針

### 5.1 Docker イメージのビルド（CI）

本番環境向けには、CI 上で以下のようにビルドする。

```bash
cd backend

docker build -t <registry>/chat_app_backend:TAG .
docker push <registry>/chat_app_backend:TAG
```

* `target` を指定しなければ、最終ステージ（`runner`）のイメージが作成される。
* 本番では `NODE_ENV=production`、`node dist/main.js` で実行される構成とする。

### 5.2 AWS 側での実行

* AWS ECS / Fargate 等で、上記イメージを指定してコンテナを起動。

* 代表的な設定例（タスク定義イメージ）：

  * `image`: `<registry>/chat_app_backend:TAG`
  * `environment`:
    * `APP_ENV=production`
    * `BACKEND_PORT=3000`
  * `secrets`:
    * `BACKEND_DB_URL`（Parameter Store / Secrets Manager から注入）
  * `portMappings`:
    * `containerPort: 3000`

* 本番で `dev` ターゲットや `yarn start:dev` を使うことは **禁止** とする。

---

## 6. 環境変数・.env ファイルとの関係

### 6.1 開発環境

* `backend/.env.example` - キーのみ列挙するテンプレート
* `backend/.env.docker` - Docker Compose 開発用

docker-compose からは以下のように参照する：

```yaml
env_file:
  - ./backend/.env.docker
```

### 6.2 本番環境

* DB 接続情報などの機密値は AWS Secrets Manager / SSM Parameter Store で管理し、ECS タスク定義の `secrets` 経由で注入する。
* バックエンド側コードでは、従来どおり `process.env.*` を通じて参照し、Zod によるバリデーションを行う。

---

## 7. 実装成果物

本設計書に基づき、以下のファイルが実装される：

| ファイル | 説明 |
|----------|------|
| `backend/Dockerfile` | base/dev/builder/runner の 4 ステージ構成 |
| `docker-compose.yml` | backend サービスに target: dev と volumes 追加 |
