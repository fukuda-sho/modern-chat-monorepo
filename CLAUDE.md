# CLAUDE.md

このファイルは、このリポジトリで **AI（Claude / ChatGPT など）に実装や設計を依頼する際に必ず遵守してほしいルール** をまとめたものです。
以降の内容に反する提案・コード・設定は行わないでください。

---

## 0. このファイルの目的

- プロジェクト全体で統一されたスタイル・設計・運用ルールを維持すること
- AI によるコード生成やリファクタリングが、既存の設計・技術スタック・ポリシーを壊さないようにすること
- 「どのような前提でコードを書いてほしいか」を、**人間と AI の両方に対して明文化**すること

---

## 1. 全体前提（共通ポリシー）

このプロジェクトに関する **すべての実装・設定・コード生成** は、以下の共通ルールに従ってください。

### 1-1. パッケージマネージャ

- 使用するパッケージマネージャは **`yarn`** とする（`npm` / `npx` は原則使用しない）。
- コマンドの例を提示する場合も、必ず `yarn` を使うこと：
  - 依存追加: `yarn add <package>` / `yarn add -D <dev-package>`
  - 実行例: `yarn dev`, `yarn start:dev`, `yarn lint`, `yarn test` など

### 1-2. ESLint / Prettier

- コードは **ESLint / Prettier による静的解析・整形** を前提としたスタイルで記述すること。
- インデント・クオート・セミコロン等は既存設定に従うこと（独自の好みを持ち込まない）。
- 必要に応じて設定例を提示する場合も、既存 `.eslintrc.*` / `.prettierrc.*` と整合する形を前提とすること。

### 1-3. JSDoc

- 関数・クラス・主要なサービス / コントローラ / Gateway には、可能な範囲で **JSDoc コメント** を付与すること。
- サンプルコードを提示する際は、少なくとも代表的なメソッドや公開 API に JSDoc を含めること。
  - `@param`, `@returns`, 簡単な説明を心がける。

### 1-4. ファイル命名規則

- 新規ファイルは、既存と同じく **`kebab-case`** で作成すること。
  - 例: `chat-gateway.ts`, `chat-rooms.service.ts`, `create-room-dialog.tsx`
- ディレクトリツリーやファイル名を提示する場合も、この命名規則に従うこと。
- NestJS / Next.js の慣習的なサフィックスも合わせる：
  - `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.gateway.ts`, `*.dto.ts`, など。

### 1-5. `any` 型の禁止と型安全

- TypeScript の `any` 型は **原則禁止**。
- 型定義やジェネリクス / ユニオン型 / `unknown` を活用し、**型安全なデータ連携** を行うこと。
- API レスポンス型やエンティティ型は、必ず `type` / `interface` で定義してから扱うこと。
- バックエンドとフロントエンド間のデータは、**同一の型定義**（またはそれを反映した型）で整合するように設計すること。

---

## 2. 技術スタック前提

### 2-1. Backend

- フレームワーク: **NestJS 11**
- 言語: **TypeScript 5**
- ランタイム: **Node.js 22**
- ORM: **Prisma 6**
- DB: **MySQL 8**
- 認証: **JWT (Passport)**
- リアルタイム通信: **Socket.IO 4**
- API ドキュメント: **Swagger**
- パッケージマネージャ: **Yarn 4 (Corepack)**

> 上記はすでに採用済みの技術スタックです。
> **別のフレームワーク（Express, Koa, Fastify 等）への変更提案は行わないこと。**

### 2-2. Frontend

- フレームワーク: **Next.js 16 (App Router)**
- UI ライブラリ: **React 19**
- 言語: **TypeScript 5**
- スタイリング: **Tailwind CSS v4 + shadcn/ui**
- 状態管理: **Zustand 5**
- データフェッチング: **TanStack Query 5**
- フォーム: **React Hook Form + Zod**
- リアルタイム通信: **Socket.IO Client**
- パッケージマネージャ: **Yarn 4 (Corepack)**

> 他の状態管理ライブラリ（Redux, Recoil 等）を新規に持ち込む提案は基本的に行わないこと。
> 既存構成（Zustand + TanStack Query）を前提に設計・サンプルコードを提示すること。

---

## 3. Docs as Code（ドキュメント運用）

### 3-1. ドキュメント構成

`docs/` 配下は以下の役割で運用します：

- `docs/00_planning/`
  - 上流設計・企画・要件定義。
- `docs/10_implementation/`
  - 実装仕様書・指示書（機能ごとの詳細設計、API / UI / テスト方針など）。
- `docs/20_decisions/`
  - 技術的な決定事項（Architecture Decision Records / ADR）。
- `docs/90_prompt_logs/`
  - **AI work logs**：Claude や ChatGPT などとのセッション記録、
    「どのプロンプトで何を実装したか」「どの指示書に基づいたか」を残すためのログ。

> AI による作業の履歴・経緯は、`90_prompt_logs/` に Markdown などで残すことを推奨します（機能ごとに 1 ファイルなど）。

### 3-2. 実装フローの原則

- **実装に着手する前に**、必ず `docs/10_implementation/...` に Markdown で仕様書（指示書）を作成する。
  - 機能名・対象（backend / frontend / 共通）・目的・仕様・ステップ・テスト方針を含める。
- 大きな技術選定・アーキテクチャ変更・方針変更は、`docs/20_decisions/...` に ADR として記録する。
- AI に新しい機能実装を依頼する際も、このフローに従って **まず仕様書を起こしてからコード生成** を行うこと。
- AI とやりとりしたプロンプト / 回答のうち、「実際にコミットに反映したもの」は `docs/90_prompt_logs/` に簡単でよいのでログを残すこと。

---

## 4. よく使うコマンド

### 4-1. Backend (NestJS)

```bash
cd backend
yarn install              # 依存関係インストール
yarn start:dev            # 開発サーバー（ホットリロード）
yarn build                # 本番ビルド
yarn lint                 # ESLint（--fix 付き）
yarn format               # Prettier 整形

# Prisma
yarn prisma:generate      # Prisma Client 生成
yarn prisma:migrate       # マイグレーション実行（開発）
yarn prisma:studio        # Prisma Studio GUI
```

### 4-2. Frontend (Next.js)

```bash
cd frontend
yarn install              # 依存関係インストール
yarn dev                  # 開発サーバー（ポート 3001）
yarn build                # 本番ビルド
yarn lint                 # ESLint
yarn format               # Prettier 整形
yarn format:check         # 整形チェック（書き込みなし）
```

### 4-3. Docker Development

```bash
docker compose up -d                    # 全サービス起動
docker compose down                     # 全サービス停止
docker compose logs -f backend          # バックエンドログ追跡
docker compose exec backend yarn prisma:migrate  # コンテナ内マイグレーション
docker compose up -d --build            # Dockerfile 変更後の再ビルド
docker compose down -v                  # 停止＋DBデータ削除
```

---

## 5. Docker / 開発環境の前提

### 5-1. Dockerfile 方針

- **backend / frontend ともにマルチステージビルド**を採用する。
- Backend:
  - ステージ例: `base` → `dev` → `builder` → `runner`
  - 開発: `dev` ターゲットで `yarn start:dev` を実行（ホットリロード）
  - 本番: `builder` → `runner` でビルド済みコードを実行
- Frontend:
  - ステージ例: `base` / `deps` / `builder` / `runner`
  - 開発: `target: dev` + volume mount して `yarn dev`
  - 本番: Next.js `output: "standalone"` を前提とした `runner` ステージ

### 5-2. docker-compose 前提

- 想定パス: `/home/deploy/development/docker-compose.yml`
- **既存の compose にサービス定義を追記する形で設計する**（新しい compose ファイルを乱立させない）。
- Backend / Frontend の `env_file` はそれぞれ `./backend/.env.*` / `./frontend/.env.*` を参照する。

### 5-3. デフォルトポート

- Frontend: 3001 (host) → 3000 (container)
- Backend: 3000
- MySQL: 3307 (host) → 3306 (container)

---

## 6. 環境変数のルール

### 6-1. Backend

- DB 接続 URL は **`DATABASE_URL`** を標準とする。
  - Prisma の `schema.prisma` も `env("DATABASE_URL")` を利用している。
- `.env` / `.env.development` に最低限以下を定義する：

```env
APP_ENV=development
APP_LOG_LEVEL=debug
BACKEND_PORT=3000
DATABASE_URL=mysql://user:password@db:3306/app_db
JWT_SECRET=changeme
JWT_EXPIRES_IN=1h
```

- Prisma CLI / マイグレーションは `DATABASE_URL` を参照する前提で構成する。
- NestJS 側でも `DATABASE_URL` を優先利用する（必要に応じて `BACKEND_DB_URL` からのフォールバックを許容）。

### 6-2. Frontend

- ブラウザに露出する環境変数は **`NEXT_PUBLIC_` プレフィックス**を必須とする。
- `.env` の例：

```env
APP_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://backend:3000
NEXT_PUBLIC_WS_URL=ws://backend:3000
NEXT_PUBLIC_APP_VERSION=local
```

- 直接 `process.env.NEXT_PUBLIC_...` を各所で参照せず、**`config/env.ts` を経由して型安全にアクセス**する。

---

## 7. アーキテクチャ

### 7-1. Backend (`backend/`)

NestJS 11 API サーバー。モジュール構成：

- **AuthModule**: JWT 認証（Passport）、ガードは `/src/auth/guards/`
- **ChatModule**: WebSocket ゲートウェイ（Socket.IO）、`/src/chat/chat.gateway.ts`
- **UsersModule**: ユーザー CRUD
- **PrismaModule**: DB 抽象化層、`/src/prisma/`
- **HealthModule**: ヘルスチェックエンドポイント

主要パターン：
- 全モジュールは NestJS 規約に従う: `*.module.ts`, `*.controller.ts`, `*.service.ts`
- WebSocket 認証は `WsJwtAuthGuard` でソケットハンドシェイク時の JWT を検証
- DTO は class-validator デコレータでバリデーション
- Swagger ドキュメントは `/api` で自動生成

### 7-2. Frontend (`frontend/`)

Next.js 16 App Router アーキテクチャ：

- **Route Groups**: `(auth)/` でログイン/サインアップ、`(main)/` で認証後ページ
- **Features Module Pattern**: 各機能（`auth`, `chat`）は独自の `api/`, `components/`, `hooks/`, `store/`, `schemas/`, `types/` を持つ
- **状態管理**: Zustand ストア + devtools middleware（`features/chat/store/chat-store.ts` 参照）
- **データフェッチング**: TanStack Query で REST API 呼び出し、カスタムフックでラップ
- **WebSocket クライアント**: `lib/socket.ts` でシングルトン、自動再接続（指数バックオフ）
- **API クライアント**: `lib/api-client.ts` で fetch ベース、JWT 自動注入

UI スタック: Tailwind CSS v4 + shadcn/ui コンポーネント（`components/ui/`）

### 7-3. Database

MySQL 8 + Prisma ORM。スキーマは `backend/prisma/schema.prisma`：
- `User` → has many `Message`
- `ChatRoom` → has many `Message`
- `Message` → belongs to `User` and `ChatRoom`

### 7-4. リアルタイム通信フロー

1. フロントエンドが JWT を auth ヘッダーに含めて Socket.IO 接続
2. `WsJwtAuthGuard` がトークン検証し、ユーザー情報をソケットにアタッチ
3. クライアントが `joinRoom`/`leaveRoom` を emit してルーム管理
4. クライアントが `sendMessage` を emit → ゲートウェイが DB 保存 → `messageCreated` をルームにブロードキャスト

---

## 8. テストポリシー

### 8-1. Backend テスト

- テストランナー: **Jest**
- 補助ライブラリ: **@nestjs/testing**
- テストファイル: `*.spec.ts`（ソースと同階層に配置）
- コマンド:
  - `yarn test`
  - `yarn test:watch`
  - `yarn test:coverage`
- 新機能・バグ修正を行う際は、以下を **必ずセットで行う**：
  - Service / Controller / Gateway 等のビジネスロジックに対する単体テストの追加
  - 既存テストの更新・整合性確認

### 8-2. Frontend テスト

- テストランナー: **Vitest**
- コンポーネントテスト: **React Testing Library**
- DOM 環境: **jsdom**
- テストファイル: `*.test.ts` / `*.test.tsx`（ソースと同階層に配置）
- コマンド:
  - `yarn test`
  - `yarn test:watch`
  - `yarn test:coverage`
- コンポーネントテストでは、`getByRole`, `getByLabelText`, `getByText` など **ユーザー視点のクエリ**を利用し、クラス名など内部実装に依存しない書き方を優先する。
- 新機能・不具合修正を行う際は、該当箇所に対するテストケースも必ず追加すること。

---

## 9. ESLint 設定

- Backend: 厳格な TypeScript ルール（`@typescript-eslint/no-explicit-any: error`）、Prettier 連携
- Frontend: Next.js core-web-vitals + TypeScript recommended ルール

---

## 10. 実装依頼時のお願い（AI 向け）

- 新機能 / バグ修正を依頼する際は、まず `docs/10_implementation/...` に仕様書（指示書）を作成してください。
- AI は、この **CLAUDE.md で定めたポリシー** と **仕様書** に従ってのみコードを生成してください。
- 既存コードや README と矛盾する変更提案は行わないこと。
  矛盾がありそうな場合は、**現状に合わせて保守的に提案**するか、「どちらを優先すべきか」人間の判断を求めてください。
- AI とのやりとりで実際にコミットに反映した内容は、`docs/90_prompt_logs/` に簡易ログとして残すことを推奨します。

---

このファイルの内容は、**このリポジトリで AI を使って開発を行う際の絶対ルール**です。
内容を更新した場合は、`docs/20_decisions/` に経緯を ADR として残すことを推奨します。
