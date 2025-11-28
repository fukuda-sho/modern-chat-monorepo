# 作業ログ: データベース設計とDocker環境構築

## 作業日

2025-11-25

---

## 実施した作業の概要

### 1. backend/ フォルダの作成

- プロジェクトルート直下に `backend/` ディレクトリを作成
- Prisma スキーマ用の `backend/prisma/` ディレクトリも同時に作成

### 2. 設計ドキュメントの作成

**ファイル**: `docs/00_planning/database.md`

- ER図（テキストベース）によるテーブル設計の視覚化
- User, ChatRoom, Message の3モデルの概念レベルでのフィールド定義
- リレーション（1:N関係）の説明
- MySQL採用理由と設定上の注意点（utf8mb4、照合順序）

### 3. DB定義書の作成

**ファイル**: `docs/10_implementation/db_definition.md`

- 物理レベルでのテーブル定義（MySQL型）
- 外部キー制約の定義（ON DELETE CASCADE, ON UPDATE CASCADE）
- インデックス定義（主キー、ユニーク、外部キー、複合）
- 文字コード・照合順序の設定方法
- DDLサンプルの提供

### 4. docker-compose.yml による MySQL コンテナの構築設定

**ファイル**: `docker-compose.yml`（プロジェクトルート）

- MySQL最新版イメージを使用
- utf8mb4 文字コード設定
- Named Volume によるデータ永続化
- ネットワーク設定とヘルスチェック

### 5. Prisma スキーマ定義の作成

**ファイル**: `backend/prisma/schema.prisma`

- MySQL プロバイダー設定
- User, ChatRoom, Message モデルの定義
- 適切なリレーション設定（1:N）
- インデックス定義

---

## テーブル設計とリレーションの要約

### モデル構成

| モデル    | 主なフィールド                              |
|----------|-------------------------------------------|
| User     | id, username, email, password, createdAt  |
| ChatRoom | id, name, createdAt                       |
| Message  | id, content, userId, chatRoomId, createdAt |

### リレーション

```
User (1) ──── (N) Message (N) ──── (1) ChatRoom
```

- **User : Message = 1 : N** — 1ユーザーが複数メッセージを投稿
- **ChatRoom : Message = 1 : N** — 1ルームに複数メッセージが存在
- **Message** は User と ChatRoom を結びつける中間エンティティ

---

## MySQL 設定に関する決定事項

### utf8mb4 採用の理由

- MySQL の `utf8` は3バイトまでしか対応せず、絵文字（4バイト文字）を格納できない
- `utf8mb4` は4バイトUTF-8に完全対応し、絵文字や特殊文字を正しく保存可能
- 多言語対応のチャットアプリケーションに必須

### 照合順序

- **utf8mb4_unicode_ci** を採用
- Unicode標準の照合順序で多言語での正確なソートが可能

### docker-compose.yml の設定

| 設定項目           | 値                        | 説明                             |
|-------------------|--------------------------|----------------------------------|
| イメージ           | mysql:latest             | MySQL最新安定版                   |
| 文字コード         | utf8mb4                  | 絵文字対応                        |
| 照合順序           | utf8mb4_unicode_ci       | Unicode標準                      |
| データベース名     | chat_app                 | アプリケーション用DB              |
| ユーザー名         | chat_user                | アプリケーション接続用            |
| ボリューム         | db_data:/var/lib/mysql   | データ永続化                      |
| ポート             | 3306:3306                | ホストからの接続用                |
| ネットワーク       | chat_network             | コンテナ間通信用                  |

---

## 作成ファイル一覧

| ファイルパス                              | 種別         |
|------------------------------------------|-------------|
| `docs/00_planning/database.md`           | 設計ドキュメント |
| `docs/10_implementation/db_definition.md` | DB定義書     |
| `docker-compose.yml`                     | インフラ設定  |
| `backend/prisma/schema.prisma`           | スキーマ定義  |
| `docs/90_prompt_logs/01_setup_db.md`     | 作業ログ     |
