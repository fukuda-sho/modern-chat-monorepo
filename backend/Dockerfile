# backend/Dockerfile
# マルチステージビルド: builder -> runner
#
# ビルド: docker build -t chat-backend .
# 起動: docker run -p 3000:3000 --env-file .env.development chat-backend

# ============================================
# Builder ステージ
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Corepack を有効化して Yarn を使用
RUN corepack enable

# 依存関係ファイルをコピー
COPY package.json yarn.lock .yarnrc.yml ./

# 依存関係をインストール（Yarn Berry）
RUN yarn install --immutable

# Prisma スキーマをコピーしてクライアント生成
COPY prisma ./prisma
RUN yarn prisma:generate

# ソースコードをコピー
COPY tsconfig.json nest-cli.json ./
COPY src ./src

# TypeScript ビルド
RUN yarn build

# ============================================
# Runner ステージ
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Corepack を有効化
RUN corepack enable

# セキュリティ: 非 root ユーザーで実行
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# 本番環境設定
ENV NODE_ENV=production
ENV BACKEND_PORT=3000

# 依存関係ファイルをコピー
COPY package.json yarn.lock .yarnrc.yml ./

# 本番依存のみインストール（Yarn Berry では --production フラグがないため、全依存をインストール）
# 注: 本番環境では node_modules のサイズ最適化が必要な場合は別途対応
RUN yarn install --immutable

# Prisma クライアントをコピー
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

# ビルド成果物をコピー
COPY --from=builder /app/dist ./dist

# 所有者を変更
RUN chown -R nestjs:nodejs /app

# 非 root ユーザーに切り替え
USER nestjs

# ポートを公開
EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# アプリケーション起動
CMD ["yarn", "start:prod"]
