# 11. Frontend 環境変数・設定値管理方針（Next.js）

## 0. ファイル情報

- パス: `docs/10_implementation/frontend/05_frontend-env-and-config-management.md`
- 対象: フロントエンドアプリケーション（`frontend/` ディレクトリ配下）
- 目的:
  - Next.js (App Router) / React ベースのフロントエンドにおける環境変数・設定値（特に `NEXT_PUBLIC_*`）の管理方針を統一する。
  - 開発環境（Docker + .env）と本番環境（AWS + Docker）での扱いを明確にする。

---

## 1. 前提・スコープ

### 1.1 前提

- ディレクトリ構成:
  - フロントエンド: `frontend/`
- 技術スタック:
  - Next.js 15 (App Router)
  - React 19
  - Tailwind CSS v4 / shadcn/ui
  - 状態管理: Zustand + TanStack Query v5
- 実行環境:
  - 開発: `/home/deploy/development/docker-compose.yml` から Docker コンテナとして起動
  - 本番: AWS 上の Docker コンテナとして起動

### 1.2 スコープ

- 含まれるもの:
  - Next.js 特有の環境変数（`NEXT_PUBLIC_*`）の方針
  - 開発環境での `.env` ファイル管理
  - 本番環境での設定値の注入方法（ビルド時 / 実行時）
- 含まれないもの:
  - Backend の環境変数（別ドキュメントを参照）

---

## 2. 環境変数のカテゴリと命名

### 2.1 カテゴリ

1. **公開設定値（Public）**

   - ブラウザからも見える値
   - Next.js では **`NEXT_PUBLIC_` プレフィックス必須**
   - 例:
     - `NEXT_PUBLIC_API_BASE_URL`
     - `NEXT_PUBLIC_WS_URL`
     - `NEXT_PUBLIC_APP_VERSION`

2. **サーバー専用値（Non-public）**
   - Next.js のサーバーコンポーネントや Route Handler のみで利用する値
   - 例:
     - 管理画面用の内部 API キー（必要なら）
   - ブラウザには出さないため、`NEXT_PUBLIC_` は付けない。

### 2.2 命名ルール

- 形式: `SCREAMING_SNAKE_CASE`
- フロントの公開値はすべて `NEXT_PUBLIC_` 接頭辞。
- 代表例:

```text
APP_ENV=development          # サーバー専用（必要なら）
NEXT_PUBLIC_API_BASE_URL=http://backend:4000
NEXT_PUBLIC_WS_URL=ws://backend:4000
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## 3. 開発環境（Docker + .env ファイル）

### 3.1 ファイル構成

- `frontend/.env.example`

  - 使用するキーのみ記載（値はダミー）
  - **Git 管理 する**

- `frontend/.env.development`
  - 開発環境実値（Docker 用）
  - **Git 管理 しない**

#### 例: `frontend/.env.example`

```env
APP_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://backend:4000
NEXT_PUBLIC_WS_URL=ws://backend:4000
NEXT_PUBLIC_APP_VERSION=local
```

### 3.2 docker-compose との連携

既存の `/home/deploy/development/docker-compose.yml` の frontend サービスに、`env_file` を設定する。

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    env_file:
      - ./frontend/.env.development
    ports:
      - '3001:3001'
    depends_on:
      - backend
```

これにより、コンテナ内で Next.js 実行時（`yarn dev` / `yarn build` / `yarn start`）に環境変数が参照される。

`.env.development` は **開発環境の単一の真実のソース** とし、別途 dotenv などで重複ロードしない。

### 3.3 Next.js コード側の扱い

クライアントコンポーネントからは `process.env.NEXT_PUBLIC_...` で直接読むのではなく、一箇所にラップしたコンフィグモジュールから参照する。

#### 例: `frontend/config/env.ts`

```typescript
// frontend/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  appEnv: z.string().default('development'),
  apiBaseUrl: z.string().url(),
  wsUrl: z.string().url(),
  appVersion: z.string().default('dev'),
});

export const env = envSchema.parse({
  appEnv: process.env.APP_ENV ?? 'development',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev',
});
```

必要であれば Zod などでバリデーションする（型安全性向上のため）。

---

## 4. 本番環境（AWS + Docker）での管理方針

### 4.1 基本戦略

Next.js の `NEXT_PUBLIC_*` は **ビルド時に埋め込まれる** ため、
本番では **「ビルド時に環境変数を注入する」戦略（ビルド時注入）** を基本とする。

**方針:**

1. フロントエンドの Docker イメージは CI 上でビルドする。
2. その CI 実行環境に、AWS Systems Manager Parameter Store / Secrets Manager 等から設定値を取得して環境変数として設定する。
3. `docker build` 内で `yarn build` を実行する際、`NEXT_PUBLIC_*` が設定された状態になる。
4. 生成されたイメージを AWS にデプロイする。

### 4.2 Parameter / Secrets の構造例

Frontend 用設定値は主に「公開設定値」扱いとし、Parameter Store に保存する:

```text
/app/chat-service/production/frontend/NEXT_PUBLIC_API_BASE_URL
/app/chat-service/production/frontend/NEXT_PUBLIC_WS_URL
/app/chat-service/production/frontend/NEXT_PUBLIC_APP_VERSION
```

機密情報をフロントで扱う必要が出た場合は、設計を見直す（基本は持たない）。

### 4.3 CI でのビルド時注入イメージ

1. CI ジョブ内で Parameter Store から値取得（例: `aws ssm get-parameter ...`）。

2. シェルで環境変数として export:

```bash
export NEXT_PUBLIC_API_BASE_URL="https://api.example.com"
export NEXT_PUBLIC_WS_URL="wss://ws.example.com"
export NEXT_PUBLIC_APP_VERSION="$GIT_COMMIT_SHORT"
```

3. その状態で `docker build ./frontend -t <registry>/frontend:TAG` を実行。

4. `frontend/Dockerfile` 内の `yarn build` 実行時に、上記変数が Next.js に渡される。

5. コンテナ実行時には `NEXT_PUBLIC_*` がすでに埋め込まれているため、実行時に再設定する必要はない。

---

## 5. Dockerfile 側の前提

`frontend/Dockerfile` は既定のマルチステージ構成（deps / builder / runner）とし、builder ステージで `yarn build` を実行する。

builder ステージの `RUN yarn build` 実行時に `NEXT_PUBLIC_*` が設定されていることが前提。

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ここで NEXT_PUBLIC_* が環境変数として渡ってくる想定
RUN yarn build
```

---

## 6. 運用ルール & ToDo

### 6.1 運用ルール

1. **フロント用環境変数を変更したい場合:**

   - `frontend/.env.example` にキーを追加・更新する。
   - 開発用 `.env.development` を更新する。
   - 本番用は Parameter Store の該当キーを更新し、CI ビルドのタイミングで新しい値が反映されるようにする。

2. **機密情報をフロントで扱わない。**

   - 必要になった場合は backend 経由の API で対応し、本ドキュメント＋バックエンド側の設計見直しが必要。

3. **環境変数を直接コンポーネント内で乱用せず、`config/env.ts` のような集中管理モジュール経由で利用する。**

### 6.2 ToDo

- [x] `frontend/.env.example` を作成し、現在利用予定の `NEXT_PUBLIC_*` をすべて列挙する。
- [x] `/home/deploy/development/docker-compose.yml` の frontend サービスに `env_file: ./frontend/.env.development` を追加する。
- [x] `frontend/config/env.ts` を実装し、環境変数アクセスを一箇所に集約する。
- [ ] CI で Parameter Store から値を取得し、`docker build` 実行前に `NEXT_PUBLIC_*` を export する処理を設計する。
