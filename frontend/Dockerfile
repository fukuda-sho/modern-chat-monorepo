# frontend/Dockerfile
# Next.js 16 / React 19 / Tailwind CSS v4 フロントエンドのマルチステージビルド
#
# 開発環境:
#   docker compose up frontend  # target: dev が使用される
#
# 本番ビルド:
#   docker build -t chat-frontend .  # runner ステージが使用される
#
# ポート設定:
#   - コンテナ内部: 3000
#   - ホスト側: 3001（docker-compose.yml で 3001:3000 にマッピング）

# ==============================================================================
# Stage 1: base - 共通設定
# ==============================================================================
FROM node:20-alpine AS base
WORKDIR /app

# Yarn の有効化（Corepack 経由）
RUN corepack enable

# Next.js の匿名テレメトリを無効化
ENV NEXT_TELEMETRY_DISABLED=1

# ==============================================================================
# Stage 2: dev - 開発環境（yarn dev + ホットリロード）
# ==============================================================================
FROM base AS dev

# 開発環境設定
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 依存関係ファイルをコピー
COPY package.json yarn.lock .yarnrc.yml ./

# 依存関係のインストール
RUN yarn install --immutable

# ソースコードは docker-compose から volume mount される
# CMD は docker-compose で上書きされるが、デフォルトも設定
CMD ["yarn", "dev", "-p", "3000"]

# ==============================================================================
# Stage 3: deps - 本番用依存関係のインストール
# ==============================================================================
FROM base AS deps

# 依存関係ファイルをコピー
COPY package.json yarn.lock .yarnrc.yml ./

# 依存関係のインストール（frozen-lockfile で再現性を保証）
RUN yarn install --immutable

# ==============================================================================
# Stage 4: builder - 本番ビルド
# ==============================================================================
FROM base AS builder

# deps ステージから node_modules をコピー
COPY --from=deps /app/node_modules ./node_modules

# アプリケーションソースをコピー
COPY . .

# ビルド実行（next.config.ts で output: "standalone" が設定済み）
RUN yarn build

# ==============================================================================
# Stage 5: runner - 本番実行環境
# ==============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# セキュリティのため非 root ユーザーを作成
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 本番環境設定
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# standalone 出力からビルド成果物をコピー
# standalone には必要な node_modules のサブセットが含まれる
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 非 root ユーザーに切り替え
USER nextjs

# ポート公開
EXPOSE 3000

# Next.js standalone サーバーの起動
CMD ["node", "server.js"]
