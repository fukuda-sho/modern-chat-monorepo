# 11. Backend 環境変数・シークレット管理方針

## 0. ファイル情報

- パス: `docs/10_implementation/backend/04_backend-env-and-secrets-management.md`
- 対象: バックエンドアプリケーション（`backend/` ディレクトリ配下）
- 目的:
  - Backend における環境変数・シークレット管理のルールを統一する。
  - 開発環境（Docker + ファイル読み込み）と本番環境（AWS + Docker）で、一貫性のある運用ができるようにする。

---

## 1. 前提・スコープ

### 1.1 前提

- ディレクトリ構成:
  - バックエンド: `backend/`
- 実行環境:
  - 開発: `/home/deploy/development/docker-compose.yml` から Docker コンテナとして起動
  - 本番: AWS 上で Docker コンテナとして実行（ECS / Fargate / EC2 + コンテナサービス等を想定）
- 言語 / ランタイム:
  - Node.js + TypeScript（strict mode）
  - パッケージマネージャ: `yarn`

### 1.2 スコープ

- 含まれるもの:
  - Backend 専用の環境変数一覧の考え方（カテゴリ・命名規則）
  - 開発環境での .env ファイル運用方針
  - 本番環境（AWS）での Secrets / Parameter 管理方針
  - `backend` コード内での読み取り・バリデーションの方針
- 含まれないもの:
  - AWS リソース定義（CDK / Terraform 等のコード）
  - フロントエンド用環境変数（別ドキュメントで管理）

---

## 2. 環境変数のカテゴリと命名

### 2.1 カテゴリ

1. **アプリ設定値（非機密 Config）**

   - 例:
     - `APP_ENV` (`development` / `staging` / `production`)
     - `APP_LOG_LEVEL` (`debug` / `info` / `warn` / `error`)
     - `BACKEND_PORT`（リッスンポート）

2. **機密情報（Secrets）**
   - 例:
     - `BACKEND_DB_URL`（DB 接続文字列）
     - `BACKEND_JWT_SECRET`（JWT 署名鍵）
     - 外部サービス API キー（`BACKEND_SOME_API_KEY` など）

### 2.2 命名ルール

- 形式: `SCREAMING_SNAKE_CASE`
- 推奨接頭辞:
  - 共通: `APP_`（環境・ログレベルなど）
  - Backend 固有: `BACKEND_`

例：

```text
APP_ENV=development
APP_LOG_LEVEL=debug
BACKEND_PORT=4000
BACKEND_DB_URL=mysql://...
BACKEND_JWT_SECRET=...
```

---

## 3. 開発環境（Docker + .env ファイル）

### 3.1 ファイル構成

- `backend/.env.example`
  - 使用するすべてのキーのみ定義（値はダミー）
  - **Git 管理する**
- `backend/.env.development`
  - 開発環境実際値（ローカル Docker 用）
  - **Git 管理しない**
- （必要であれば）`backend/.env.test` などを追加

### 3.2 docker-compose との連携

既存の `/home/deploy/development/docker-compose.yml` の backend サービスに対して、以下のように `env_file` を設定する。

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    env_file:
      - ./backend/.env.development
    # 既存の ports / depends_on / networks などはプロジェクトに合わせて維持
```

これにより、`backend/.env.development` の内容がコンテナ内環境変数として利用可能になる。

ローカル実行（Docker 経由）では、`.env.development` が唯一のソースになるようにし、別途 dotenv で同じファイルを重複ロードしない。

### 3.3 Backend コード側の扱い

- 環境変数は `process.env` から参照する。
- 型安全性と漏れ防止のため、config モジュールを 1 箇所にまとめる。

例: `backend/src/config/env.ts`

```typescript
// backend/src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']),
  APP_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  BACKEND_PORT: z
    .string()
    .default('4000')
    .transform((v) => Number(v)),

  BACKEND_DB_URL: z.string().url(),
  BACKEND_JWT_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

アプリケーションコード側では、`env.BACKEND_DB_URL` 等を利用し、`process.env.*` を直接触らない方針とする。

---

## 4. 本番環境（AWS + Docker）での管理方針

### 4.1 Secrets 管理

機密情報（`BACKEND_DB_URL`, `BACKEND_JWT_SECRET`, 外部 API キー等）は **AWS Secrets Manager** または **SSM Parameter Store (SecureString)** で管理する。

例: Parameter Store のキー構造

```text
/app/chat-service/production/backend/BACKEND_DB_URL
/app/chat-service/production/backend/BACKEND_JWT_SECRET
```

### 4.2 コンテナへの注入（ECS の例）

ECS タスク定義の `secrets` セクションで Parameter / Secrets を指定し、環境変数としてコンテナに渡す。

イメージ例（JSON）:

```jsonc
{
  "name": "backend",
  "image": "xxx/backend:latest",
  "secrets": [
    {
      "name": "BACKEND_DB_URL",
      "valueFrom": "arn:aws:ssm:ap-northeast-1:123456789012:parameter/app/chat-service/production/backend/BACKEND_DB_URL"
    },
    {
      "name": "BACKEND_JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:ap-northeast-1:123456789012:secret:app/chat-service/production/backend/BACKEND_JWT_SECRET-AbCdEf"
    }
  ],
  "environment": [
    { "name": "APP_ENV", "value": "production" },
    { "name": "APP_LOG_LEVEL", "value": "info" },
    { "name": "BACKEND_PORT", "value": "4000" }
  ]
}
```

アプリ側から見れば、開発環境と同様に `process.env.*` から値が見える構成とし、コードは環境差を意識しない。

---

## 5. 運用ルール & ToDo

### 5.1 運用ルール

1. `.env.*` は Git にコミットしない（`.env.example` のみコミット）。
2. Secrets は必ず AWS 側で管理し、Slack / Teams / メールなどで平文共有しない。
3. 環境変数を追加する場合は：
   - まず本ドキュメントに追記（または別紙一覧表に追加）
   - `backend/.env.example` にキーを追加
   - 開発用 `.env.development` と AWS（Parameter / Secrets）を更新
4. 重要な変更（例：JWT シークレット更新）は、`docs/20_decisions/` 配下の ADR として残す。

### 5.2 ToDo

- [x] `backend/.env.example` を作成し、本ドキュメントの方針に沿ってキーを列挙する。
- [x] `/home/deploy/development/docker-compose.yml` の backend に `env_file` 設定を追加する。
- [x] `backend/src/config/env.ts`（または同等の config 層）を実装し、Zod 等でバリデーションを行う。
- [ ] AWS の Parameter Store / Secrets Manager に、本番用の値を登録し、ECS タスク定義から参照する。
