# ============================================
# Docker Compose 開発環境用 Makefile
# ============================================

.PHONY: up down restart logs logs-backend logs-frontend \
        migrate migrate-deploy migrate-status migrate-reset studio generate push \
        shell-backend shell-frontend shell-db \
        build rebuild clean ps \
        test test-backend test-backend-watch test-backend-coverage \
        test-frontend test-frontend-watch test-frontend-coverage help

# --------------------------------------------
# 基本操作
# --------------------------------------------

## 全サービスを起動
up:
	docker compose up -d

## 全サービスを停止
down:
	docker compose down

## 全サービスを再起動
restart:
	docker compose restart

## 全サービスの状態を確認
ps:
	docker compose ps

# --------------------------------------------
# ログ確認
# --------------------------------------------

## 全サービスのログを表示
logs:
	docker compose logs -f

## Backend のログを表示
logs-backend:
	docker compose logs -f backend

## Frontend のログを表示
logs-frontend:
	docker compose logs -f frontend

# --------------------------------------------
# データベース操作
# --------------------------------------------

## Prisma マイグレーション実行（開発用）
migrate:
	docker compose exec backend yarn prisma:migrate

## Prisma マイグレーション適用（本番用・対話なし）
migrate-deploy:
	docker compose exec backend yarn prisma:migrate:deploy

## Prisma マイグレーション状態確認
migrate-status:
	docker compose exec backend yarn prisma:migrate:status

## Prisma データベースリセット（全データ削除）
migrate-reset:
	docker compose exec backend yarn prisma:migrate:reset

## Prisma Studio 起動
studio:
	docker compose exec backend yarn prisma:studio

## Prisma クライアント生成
generate:
	docker compose exec backend yarn prisma:generate

## Prisma スキーマをDBに直接反映（プロトタイプ用・マイグレーション不要）
push:
	docker compose exec backend yarn prisma:push

# --------------------------------------------
# シェルアクセス
# --------------------------------------------

## Backend コンテナにシェル接続
shell-backend:
	docker compose exec backend sh

## Frontend コンテナにシェル接続
shell-frontend:
	docker compose exec frontend sh

## DB コンテナにシェル接続
shell-db:
	docker compose exec db mysql -u chat_user -pchat_password chat_app

# --------------------------------------------
# ビルド操作
# --------------------------------------------

## イメージをビルド
build:
	docker compose build

## キャッシュなしでイメージをリビルド
rebuild:
	docker compose build --no-cache

## コンテナ・ボリュームを削除（DB データも削除）
clean:
	docker compose down -v

# --------------------------------------------
# テスト
# --------------------------------------------

## 全テスト実行（Backend + Frontend）
test:
	@echo "=== Running Backend Tests ==="
	docker compose exec backend yarn test
	@echo ""
	@echo "=== Running Frontend Tests ==="
	docker compose exec frontend yarn test

## Backend 単体テスト実行
test-backend:
	docker compose exec backend yarn test

## Backend テスト（ウォッチモード）
test-backend-watch:
	docker compose exec backend yarn test:watch

## Backend テスト（カバレッジ付き）
test-backend-coverage:
	docker compose exec backend yarn test:coverage

## Frontend 単体テスト実行
test-frontend:
	docker compose exec frontend yarn test

## Frontend テスト（ウォッチモード）
test-frontend-watch:
	docker compose exec frontend yarn test:watch

## Frontend テスト（カバレッジ付き）
test-frontend-coverage:
	docker compose exec frontend yarn test:coverage

# --------------------------------------------
# ヘルプ
# --------------------------------------------

## コマンド一覧を表示
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "基本操作:"
	@echo "  up             全サービスを起動"
	@echo "  down           全サービスを停止"
	@echo "  restart        全サービスを再起動"
	@echo "  ps             全サービスの状態を確認"
	@echo ""
	@echo "ログ確認:"
	@echo "  logs           全サービスのログを表示"
	@echo "  logs-backend   Backend のログを表示"
	@echo "  logs-frontend  Frontend のログを表示"
	@echo ""
	@echo "データベース操作:"
	@echo "  migrate        Prisma マイグレーション実行（開発用）"
	@echo "  migrate-deploy Prisma マイグレーション適用（本番用）"
	@echo "  migrate-status Prisma マイグレーション状態確認"
	@echo "  migrate-reset  Prisma データベースリセット（注意）"
	@echo "  push           Prisma スキーマを直接反映（プロトタイプ用）"
	@echo "  studio         Prisma Studio 起動"
	@echo "  generate       Prisma クライアント生成"
	@echo ""
	@echo "シェルアクセス:"
	@echo "  shell-backend  Backend コンテナにシェル接続"
	@echo "  shell-frontend Frontend コンテナにシェル接続"
	@echo "  shell-db       DB コンテナに MySQL 接続"
	@echo ""
	@echo "ビルド操作:"
	@echo "  build          イメージをビルド"
	@echo "  rebuild        キャッシュなしでイメージをリビルド"
	@echo "  clean          コンテナ・ボリュームを削除（DB データも削除）"
	@echo ""
	@echo "テスト:"
	@echo "  test                   全テスト実行（Backend + Frontend）"
	@echo "  test-backend           Backend 単体テスト実行"
	@echo "  test-backend-watch     Backend テスト（ウォッチモード）"
	@echo "  test-backend-coverage  Backend テスト（カバレッジ付き）"
	@echo "  test-frontend          Frontend 単体テスト実行"
	@echo "  test-frontend-watch    Frontend テスト（ウォッチモード）"
	@echo "  test-frontend-coverage Frontend テスト（カバレッジ付き）"
