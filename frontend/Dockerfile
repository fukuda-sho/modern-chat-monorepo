# frontend/Dockerfile
# Next.js 16 / React 19 / Tailwind CSS v4 フロントエンドのマルチステージビルド
#
# 使用方法:
#   docker build -t chat-frontend .
#   docker run -p 3000:3000 chat-frontend
#
# ポート設定:
#   - 本番環境: PORT=3000（デフォルト）
#   - ローカル開発: PORT=3001（docker-compose.yml で上書き）

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
# ポートは環境変数で上書き可能（本番: 3000, ローカル開発: 3001）
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# standalone 出力からビルド成果物をコピー
# standalone には必要な node_modules のサブセットが含まれる
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 非 root ユーザーに切り替え
USER nextjs

# ポート公開（実際のポートは PORT 環境変数で決定）
EXPOSE 3000

# Next.js standalone サーバーの起動
CMD ["node", "server.js"]
