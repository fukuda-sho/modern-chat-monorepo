# コンテナ化戦略 (Dockerization Strategy)

## 概要

Backend (NestJS) と Frontend (Next.js) をDockerコンテナ化し、Yarnを用いた最適化ビルド環境を構築します。

## 共通戦略

### Multi-stage Build
- **Builder Stage**: 依存関係のインストールとビルドを実行
- **Runner Stage**: 本番環境用の軽量イメージを作成し、ビルド成果物のみをコピー

### パッケージ管理
- **Yarn**: パッケージ管理には `yarn` を使用
- **Lock File**: `yarn.lock` を利用してバージョンを固定 (`--frozen-lockfile`)
- **依存関係の最適化**: 本番環境では開発依存関係を除外

### Base Image
- **イメージ**: `node:*-alpine` を使用
- **理由**: 軽量で、セキュリティリスクが少ない

## Backend (NestJS) 戦略

### ビルドプロセス
1. 依存関係のインストール (`yarn install --frozen-lockfile`)
2. Prisma クライアントの生成 (`npx prisma generate`)
3. アプリケーションのビルド (`yarn build`)

### 本番環境
- **エントリーポイント**: `node dist/main`
- **必要なファイル**:
  - `dist/` (ビルド成果物)
  - `node_modules/` (本番依存関係)
  - `package.json`
  - `prisma/` (スキーマファイル、マイグレーション)

### Dockerfile 構造
```dockerfile
# Stage 1: Builder
FROM node:alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN npx prisma generate
RUN yarn build

# Stage 2: Runner
FROM node:alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
CMD ["node", "dist/main"]
```

## Frontend (Next.js) 戦略

### Standalone モード
- **設定**: `next.config.ts` に `output: 'standalone'` を追加
- **利点**:
  - 必要最小限の依存関係のみをバンドル
  - イメージサイズの大幅な削減
  - 起動時間の短縮

### ビルドプロセス
1. 依存関係のインストール (`yarn install --frozen-lockfile`)
2. Next.js ビルド (`yarn build`)
3. Standalone 出力の生成

### 本番環境
- **エントリーポイント**: `node server.js`
- **必要なファイル**:
  - `.next/standalone/` (Standaloneビルド成果物)
  - `.next/static/` (静的アセット)
  - `public/` (公開ファイル)

### Dockerfile 構造
```dockerfile
# Stage 1: Builder
FROM node:alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Stage 2: Runner
FROM node:alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]
```

## Docker Compose 構成

### サービス定義
```yaml
version: '3.8'

services:
  mysql:
    # 既存のMySQLサービス

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: chat_backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://chat_user:chat_password@mysql:3306/chat_db
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mysql

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: chat_frontend
    restart: always
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3000
    depends_on:
      - backend
```

## .dockerignore 戦略

### 除外対象
- `node_modules/` - ビルド時に再インストール
- `.git/` - バージョン管理ファイル
- `.env*` - 環境変数ファイル（本番環境では別途設定）
- `dist/`, `.next/` - ビルド成果物（ビルド時に生成）
- テストファイル、ドキュメント
- IDE設定ファイル

## セキュリティ考慮事項

1. **環境変数**: センシティブな情報は `.env` ファイルではなく、Docker Compose の環境変数やシークレット管理ツールを使用
2. **非rootユーザー**: 本番環境では非rootユーザーでアプリケーションを実行（オプション）
3. **イメージスキャン**: 定期的にセキュリティスキャンを実施
4. **最小権限の原則**: 必要最小限のファイルとパッケージのみをイメージに含める

## ビルドと実行

### ビルド
```bash
docker-compose build
```

### 起動
```bash
docker-compose up -d
```

### ログ確認
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 停止
```bash
docker-compose down
```

## パフォーマンス最適化

1. **レイヤーキャッシング**: 変更頻度の低いファイル（package.json）を先にコピー
2. **Multi-stage Build**: ビルドツールを本番イメージから除外
3. **Alpine Linux**: 軽量なベースイメージを使用
4. **Standalone モード**: Next.jsの最適化されたバンドルを使用

## トラブルシューティング

### Prisma 関連のエラー
- `npx prisma generate` がビルド時に実行されているか確認
- Prismaスキーマファイルが正しくコピーされているか確認

### Next.js Standalone モードの問題
- `output: 'standalone'` が `next.config.ts` に設定されているか確認
- 静的アセットとpublicディレクトリが正しくコピーされているか確認

### 環境変数の問題
- Docker Compose の環境変数設定を確認
- コンテナ間通信ではサービス名をホスト名として使用
