# ============================================
# Docker Compose 開発環境用 Makefile
# ============================================

.PHONY: up down restart logs logs-backend logs-frontend \
        migrate studio shell-backend shell-frontend \
        build rebuild clean ps

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

## Prisma マイグレーション実行
migrate:
	docker compose exec backend yarn prisma:migrate

## Prisma Studio 起動
studio:
	docker compose exec backend yarn prisma:studio

## Prisma クライアント生成
generate:
	docker compose exec backend yarn prisma:generate

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
	@echo "  migrate        Prisma マイグレーション実行"
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
