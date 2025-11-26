# backend/Dockerfile
# マルチステージビルド: base -> dev / builder -> runner
#
# 開発環境:
#   docker compose up backend (target: dev)
#   ホットリロード付きで起動
#
# 本番ビルド:
#   docker build -t chat-backend .
#   runner ステージが使用される

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

# 依存関係ファイルをコピー
COPY package.json yarn.lock .yarnrc.yml ./

# 全依存関係をインストール（devDependencies 含む）
RUN yarn install --immutable

# Prisma クライアント生成
COPY prisma ./prisma
RUN yarn prisma:generate

# 開発時はソースは volume mount 想定
# src/, tsconfig.json, nest-cli.json は docker-compose の volumes でマウント

EXPOSE 3000

# Nest CLI のホットリロード付き起動
CMD ["yarn", "start:dev"]

# ============================================
# Builder ステージ（本番ビルド）
# ============================================
FROM base AS builder
# NODE_ENV は設定しない（devDependencies が必要なため）

# 依存関係ファイルをコピー
COPY package.json yarn.lock .yarnrc.yml ./

# 全依存関係をインストール（devDependencies 含む、ビルドに必要）
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
# Runner ステージ（本番実行）
# ============================================
FROM base AS runner
ENV NODE_ENV=production
ENV BACKEND_PORT=3000

# wget インストール（HEALTHCHECK 用）
RUN apk add --no-cache wget

# セキュリティ: 非 root ユーザーで実行
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# builder から node_modules をコピー（.prisma 含む）
COPY --from=builder /app/node_modules ./node_modules

# Prisma スキーマをコピー（マイグレーション実行時に必要）
COPY prisma ./prisma

# ビルド成果物をコピー
COPY --from=builder /app/dist ./dist

# package.json をコピー（yarn start:prod 等で参照される可能性）
COPY package.json ./

# 所有者を変更
RUN chown -R nestjs:nodejs /app

# 非 root ユーザーに切り替え
USER nestjs

# ポートを公開
EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# アプリケーション起動（node 直接実行でシグナルハンドリングを正確に）
CMD ["node", "dist/main.js"]
