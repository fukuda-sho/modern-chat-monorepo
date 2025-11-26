# Chat Application Backend

NestJS ベースのリアルタイムチャットアプリケーション バックエンド API サーバー

## 技術スタック

| カテゴリ             | 技術                         |
| -------------------- | ---------------------------- |
| フレームワーク       | NestJS 11.x                  |
| 言語                 | TypeScript 5.x (strict mode) |
| パッケージマネージャ | Yarn 4.x (Berry)             |
| データベース         | MySQL 8.x                    |
| ORM                  | Prisma 7.x                   |
| 認証                 | JWT + Passport               |
| リアルタイム通信     | Socket.io                    |
| バリデーション       | class-validator, Zod         |
| API ドキュメント     | Swagger (OpenAPI)            |
| コンテナ             | Docker                       |

## プロジェクト構成

```
backend/
├── src/
│   ├── app.module.ts          # ルートモジュール
│   ├── main.ts                # エントリーポイント
│   ├── swagger.ts             # Swagger 設定
│   ├── auth/                  # 認証モジュール
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/               # リクエスト DTO
│   │   ├── guards/            # JWT ガード
│   │   └── strategies/        # Passport 戦略
│   ├── chat/                  # チャットモジュール (WebSocket)
│   │   ├── chat.module.ts
│   │   ├── chat.gateway.ts    # WebSocket Gateway
│   │   ├── guards/            # WS 認証ガード
│   │   └── types/             # 型定義
│   ├── common/                # 共通コンポーネント
│   │   └── dto/               # 共通 DTO
│   ├── config/                # 環境変数設定
│   │   ├── env.ts             # Zod バリデーション
│   │   └── index.ts
│   ├── health/                # ヘルスチェック
│   │   ├── health.module.ts
│   │   ├── health.controller.ts
│   │   └── health.service.ts
│   ├── prisma/                # Prisma サービス
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── users/                 # ユーザーモジュール
│       ├── users.module.ts
│       ├── users.controller.ts
│       └── users.service.ts
├── prisma/
│   └── schema.prisma          # データベーススキーマ
├── Dockerfile                 # Docker イメージ定義
├── .env.example               # 環境変数テンプレート
├── .env                       # 環境変数 (Git 管理外)
└── package.json
```

## セットアップ

### 前提条件

- Docker Desktop または Docker Engine
- Docker Compose v2

### 1. 環境変数の設定

```bash
cp .env.example .env
```

#### 環境変数一覧

| 変数名           | 説明                                  | デフォルト  |
| ---------------- | ------------------------------------- | ----------- |
| `APP_ENV`        | 環境 (development/staging/production) | development |
| `APP_LOG_LEVEL`  | ログレベル (debug/info/warn/error)    | info        |
| `BACKEND_PORT`   | サーバーポート                        | 3000        |
| `DATABASE_URL`   | MySQL 接続文字列                      | -           |
| `JWT_SECRET`     | JWT 署名キー（16文字以上）            | -           |
| `JWT_EXPIRES_IN` | JWT 有効期限                          | 1h          |

> **Note**: `DATABASE_URL` のホスト名は `db:3306`（Docker 内部ネットワーク）を使用します。

### 2. 開発環境の起動

```bash
# プロジェクトルートで実行
cd /home/deploy/development

# 全サービス起動（DB, Backend, Frontend）
docker compose up -d

# ログ確認
docker compose logs -f backend
```

### 3. データベースのセットアップ

```bash
# マイグレーション実行
docker compose exec backend yarn prisma:migrate

# Prisma クライアント生成（通常は自動実行される）
docker compose exec backend yarn prisma:generate

# (オプション) Prisma Studio 起動
docker compose exec backend yarn prisma:studio
```

## Docker 開発環境

### ホットリロードの仕組み

docker-compose.yml では `target: dev` が指定されており、ソースコードの変更が即座に反映されます。

- ローカルの `./backend` がコンテナ内の `/app` にマウントされる
- `node_modules` はコンテナ側のものが優先される
- ソースコード変更時、Nest CLI が自動で再ビルド・再起動

### よく使うコマンド

```bash
# バックエンドのみ起動
docker compose up backend -d

# ログ確認（ホットリロードの動作確認）
docker compose logs -f backend

# 停止
docker compose down

# コンテナ内でシェル実行
docker compose exec backend sh
```

### 本番環境用イメージのビルド

CI/CD などで本番用イメージを作成する場合は、`target` を指定せずにビルドします。

```bash
cd backend

# runner ステージでビルド
docker build -t chat-backend:latest .

# イメージのプッシュ
docker push <registry>/chat-backend:latest
```

### Dockerfile ステージ構成

| ステージ  | 用途   | 説明                                   |
| --------- | ------ | -------------------------------------- |
| `base`    | 共通   | Node.js 22 LTS + Corepack              |
| `dev`     | 開発   | ホットリロード付き（`yarn start:dev`） |
| `builder` | ビルド | TypeScript コンパイル                  |
| `runner`  | 本番   | 最小構成で実行（`yarn start:prod`）    |

### リビルド

コード変更後にコンテナを再ビルドする場合：

```bash
# 開発環境（通常は不要、ホットリロードで対応）
docker compose build backend && docker compose up backend -d

# キャッシュなしでビルド
docker compose build --no-cache backend
```

## API エンドポイント

### REST API

| メソッド | パス           | 説明               | 認証 |
| -------- | -------------- | ------------------ | ---- |
| `POST`   | `/auth/signup` | ユーザー登録       | 不要 |
| `POST`   | `/auth/login`  | ログイン           | 不要 |
| `GET`    | `/users/me`    | 現在のユーザー情報 | 必要 |
| `GET`    | `/health`      | ヘルスチェック     | 不要 |

### WebSocket イベント

#### Client → Server

| イベント      | ペイロード                            | 説明           |
| ------------- | ------------------------------------- | -------------- |
| `joinRoom`    | `{ roomId: number }`                  | ルーム参加     |
| `leaveRoom`   | `{ roomId: number }`                  | ルーム退出     |
| `sendMessage` | `{ roomId: number, content: string }` | メッセージ送信 |

#### Server → Client

| イベント         | ペイロード                                   | 説明           |
| ---------------- | -------------------------------------------- | -------------- |
| `roomJoined`     | `{ roomId: number }`                         | ルーム参加完了 |
| `roomLeft`       | `{ roomId: number }`                         | ルーム退出完了 |
| `messageCreated` | `{ id, roomId, userId, content, createdAt }` | 新規メッセージ |
| `error`          | `{ message: string, code?: string }`         | エラー         |

### WebSocket 接続例

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: `Bearer ${accessToken}`,
  },
});

// ルーム参加
socket.emit('joinRoom', { roomId: 1 });

// メッセージ送信
socket.emit('sendMessage', { roomId: 1, content: 'Hello!' });

// メッセージ受信
socket.on('messageCreated', (message) => {
  console.log('New message:', message);
});
```

## API ドキュメント (Swagger)

開発環境では Swagger UI が利用可能です。

```
http://localhost:3000/api/docs
```

> 注意: 本番環境 (`NODE_ENV=production`) では Swagger は無効になります。

## データベーススキーマ

### User

| カラム    | 型           | 説明                   |
| --------- | ------------ | ---------------------- |
| id        | INT          | 主キー                 |
| username  | VARCHAR(255) | ユーザー名（一意）     |
| email     | VARCHAR(255) | メールアドレス（一意） |
| password  | VARCHAR(255) | ハッシュ化パスワード   |
| createdAt | DATETIME     | 作成日時               |

### ChatRoom

| カラム    | 型           | 説明     |
| --------- | ------------ | -------- |
| id        | INT          | 主キー   |
| name      | VARCHAR(255) | ルーム名 |
| createdAt | DATETIME     | 作成日時 |

### Message

| カラム     | 型       | 説明           |
| ---------- | -------- | -------------- |
| id         | INT      | 主キー         |
| content    | TEXT     | メッセージ内容 |
| userId     | INT      | 送信者 ID      |
| chatRoomId | INT      | ルーム ID      |
| createdAt  | DATETIME | 作成日時       |

## スクリプト

| コマンド               | 説明                         |
| ---------------------- | ---------------------------- |
| `yarn build`           | TypeScript ビルド            |
| `yarn start`           | アプリ起動                   |
| `yarn start:dev`       | 開発モード（ホットリロード） |
| `yarn start:debug`     | デバッグモード               |
| `yarn start:prod`      | 本番モード                   |
| `yarn lint`            | ESLint 実行                  |
| `yarn format`          | Prettier 実行                |
| `yarn prisma:generate` | Prisma クライアント生成      |
| `yarn prisma:migrate`  | マイグレーション実行         |
| `yarn prisma:studio`   | Prisma Studio 起動           |

## 開発ガイドライン

### コーディング規約

- TypeScript strict mode を使用
- `any` 型の使用禁止
- ESLint / Prettier でコード整形
- JSDoc コメントを主要なクラス・メソッドに記載

### ファイル命名規則

- kebab-case: `auth.controller.ts`, `jwt-auth.guard.ts`
- サフィックス: `.module.ts`, `.controller.ts`, `.service.ts`, `.guard.ts`, `.dto.ts`

### 環境変数の追加

1. `.env.example` にキーを追加
2. `src/config/env.ts` の Zod スキーマを更新
3. `.env` ファイルを更新

## トラブルシューティング

### ポート 3000 が使用中

```bash
# 使用中のプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>
```

### Prisma クライアントエラー

```bash
# クライアントを再生成
yarn prisma:generate
```

### Docker ビルドエラー

```bash
# キャッシュなしでビルド
docker compose build --no-cache backend
```

## ライセンス

ISC
