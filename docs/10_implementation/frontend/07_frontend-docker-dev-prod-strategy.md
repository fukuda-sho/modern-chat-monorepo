# 07. フロントエンド Docker dev / prod 分離設計書（Next.js / frontend）

## 0. ファイル情報

- パス: `docs/10_implementation/frontend/07_frontend-docker-dev-prod-strategy.md`
- 対象: フロントエンドアプリケーション（`frontend/` ディレクトリ配下）
- 目的: Next.js フロントエンドの Docker 実行環境を、**開発用（dev）** と **本番用（prod）** に分離しつつ、1 つの Dockerfile / compose 構成で運用できるようにする方針を定義する。

---

## 1. 目的・スコープ

### 1.1 目的

- 現在のフロントエンドコンテナ構成を、「開発用」と「本番用」で明確に分離する。
- 開発環境では以下を重視する：
  - `yarn dev` によるホットリロード
  - ローカルのソースコード編集が即時反映されること（volume mount）
- 本番環境では以下を重視する：
  - ビルド済みアーティファクトのみを含む軽量イメージ
  - `NODE_ENV=production` かつ `next build` / `next start`（standalone）を利用した安定稼働
- ただし Dockerfile は可能な限り **1 ファイル** に保ち、multi-stage / multi-target で dev / prod を切り替える。

### 1.2 スコープ

- **含まれるもの**
  - `frontend/Dockerfile` の dev / prod 対応方針（multi-stage / multi-target）
  - 既存の `/home/deploy/development/docker-compose.yml` における `frontend` サービス定義の改善方針
  - 開発環境での `yarn dev` 運用と、本番環境でのビルド済みイメージ運用の切り分け

- **含まれないもの**
  - バックエンド / DB / Redis 等の Docker 化や本番インフラ（AWS ECS / ALB / Route53 等）の詳細
  - CI/CD パイプラインの具体的な実装コード

---

## 2. Dockerfile 設計方針（dev / prod 共通）

### 2.1 役割分割

`frontend/Dockerfile` は、以下のような **multi-stage 構成** とする。

| ステージ | 用途 | ターゲット |
|---------|------|-----------|
| `base` | 共通設定（Node.js, corepack） | - |
| `dev` | 開発用（yarn dev） | `dev` |
| `deps` | 本番用依存インストール | - |
| `builder` | 本番ビルド（yarn build） | - |
| `runner` | 本番実行（node server.js） | デフォルト |

### 2.2 ステージ詳細

1. **`base` ステージ**
   - Node.js 20 / `corepack enable` / 作業ディレクトリ設定など共通処理

2. **`dev` ステージ**（開発専用ターゲット）
   - `NODE_ENV=development`
   - `yarn install` を実行し、`yarn dev` でアプリを起動
   - ソースコードは docker-compose 側から volume mount する前提

3. **`deps` ステージ**（本番用依存インストール）
   - `yarn install` を実行

4. **`builder` ステージ**（本番ビルド）
   - `deps` から `node_modules` をコピー
   - アプリ本体をコピーして `yarn build` を実行
   - `next.config.ts` で `output: "standalone"` を設定

5. **`runner` ステージ**（本番実行用）
   - ビルド済みの `standalone` 出力と `public` / `.next/static` のみをコピー
   - `NODE_ENV=production` で `node server.js` を実行

---

## 3. 開発環境（dev）での利用方針

### 3.1 docker-compose 設定

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
    target: dev                 # dev ターゲットを指定
  container_name: chat_app_frontend
  restart: unless-stopped
  env_file:
    - ./frontend/.env.docker
  ports:
    - "3001:3000"               # ホスト:3001 → コンテナ:3000
  depends_on:
    - backend
  networks:
    - chat_network
  volumes:
    - ./frontend:/app           # ローカルソースをコンテナにマウント
    - /app/node_modules         # node_modules はコンテナ側を優先
    - /app/.next                # .next はコンテナ側を優先
```

### 3.2 開発時の動作

1. `docker compose up frontend` を実行
2. コンテナ内で `yarn dev` が起動（ポート 3000）
3. ホスト側からは `http://localhost:3001` でアクセス
4. ソースコード編集 → ホットリロードで即時反映

---

## 4. 本番環境（prod）での利用方針

### 4.1 Docker イメージのビルド（CI）

```bash
# target を指定しない → runner ステージが使用される
docker build -t <registry>/chat_app_frontend:TAG ./frontend
docker push <registry>/chat_app_frontend:TAG
```

### 4.2 本番実行

- `NODE_ENV=production`
- `node server.js`（Next.js standalone）
- ポート 3000 → ALB / NLB 経由でアクセス

---

## 5. 環境変数と .env ファイル運用

### 5.1 開発環境

| ファイル | 用途 |
|---------|------|
| `.env.docker` | Docker 開発用 |
| `.env.example` | テンプレート（Git 管理） |

### 5.2 本番環境

- `NEXT_PUBLIC_*` はビルド時に CI から注入
- 機密情報は持たない（backend 経由で取得）

---

## 6. ToDo

- [x] `frontend/Dockerfile` に `dev` ステージを追加
- [x] `docker-compose.yml` に `target: dev`, `volumes` を追加
- [x] `frontend/package.json` に `packageManager` フィールドを追加
- [ ] 本番用 CI/CD パイプラインの設定
