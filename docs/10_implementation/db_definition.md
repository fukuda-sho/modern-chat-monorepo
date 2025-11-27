# DB定義書

## 1. テーブル一覧

| テーブル名       | 用途                                                           |
|-----------------|---------------------------------------------------------------|
| users           | ユーザー情報を管理。認証情報（email, password）を含む          |
| chat_rooms      | チャットルーム（チャンネル）情報を管理。タイプ・作成者・説明を保持 |
| messages        | チャットメッセージを管理。ユーザーとルームを紐付ける           |
| channel_members | チャンネルメンバーシップを管理。ユーザーとルームの参加状態を保持 |

---

## 2. Enum 定義

### 2.1 ChannelType（チャンネルタイプ）

チャットルームの公開種別を定義する列挙型。

| 値      | 説明                                   |
|---------|---------------------------------------|
| PUBLIC  | 誰でも参加可能な公開チャンネル         |
| PRIVATE | 招待制のプライベートチャンネル         |
| DM      | ダイレクトメッセージ（Phase 4 で実装） |

### 2.2 MemberRole（メンバー役割）

チャンネル内でのユーザー役割を定義する列挙型。

| 値     | 説明                             |
|--------|--------------------------------|
| OWNER  | チャンネル作成者                 |
| ADMIN  | 管理者（招待・キック操作が可能） |
| MEMBER | 一般メンバー                     |

---

## 3. 各テーブルのカラム定義

### 3.1 users テーブル

ユーザーアカウント情報を格納するテーブル。

| カラム名    | 型            | 制約                              | 備考                           |
|------------|---------------|----------------------------------|--------------------------------|
| id         | INT           | PK, AUTO_INCREMENT, NOT NULL     | 主キー、自動採番               |
| username   | VARCHAR(255)  | NOT NULL, UNIQUE                 | ユーザー名（一意制約）         |
| email      | VARCHAR(255)  | NOT NULL, UNIQUE                 | メールアドレス（一意制約）     |
| password   | VARCHAR(255)  | NOT NULL                         | bcrypt等でハッシュ化済みの値   |
| created_at | DATETIME      | NOT NULL, DEFAULT CURRENT_TIMESTAMP | レコード作成日時           |

**リレーション:**
- `messages` (1:N) - ユーザーが投稿したメッセージ
- `chat_rooms` (1:N via created_by_user_id) - ユーザーが作成したチャットルーム
- `channel_members` (1:N) - ユーザーのチャンネルメンバーシップ

### 3.2 chat_rooms テーブル

チャットルーム（チャンネル）情報を格納するテーブル。

| カラム名           | 型                        | 制約                                | 備考                           |
|-------------------|---------------------------|-------------------------------------|--------------------------------|
| id                | INT                       | PK, AUTO_INCREMENT, NOT NULL        | 主キー、自動採番               |
| name              | VARCHAR(255)              | NOT NULL, UNIQUE                    | チャットルーム名（一意制約）   |
| created_by_user_id| INT                       | FK, NULLABLE                        | 作成者のユーザーID             |
| created_at        | DATETIME                  | NOT NULL, DEFAULT CURRENT_TIMESTAMP | レコード作成日時               |
| type              | ENUM('PUBLIC','PRIVATE','DM') | NOT NULL, DEFAULT 'PUBLIC'      | チャンネルタイプ               |
| description       | VARCHAR(500)              | NULLABLE                            | チャンネル説明                 |

**リレーション:**
- `created_by_user` (N:1) - チャンネル作成者への参照
- `messages` (1:N) - ルーム内のメッセージ
- `members` (1:N via channel_members) - チャンネルメンバー

### 3.3 messages テーブル

チャットメッセージを格納するテーブル。

| カラム名      | 型            | 制約                              | 備考                               |
|--------------|---------------|----------------------------------|------------------------------------|
| id           | INT           | PK, AUTO_INCREMENT, NOT NULL     | 主キー、自動採番                   |
| content      | TEXT          | NOT NULL                         | メッセージ本文（長文対応）         |
| user_id      | INT           | NOT NULL, FK                     | 投稿者のユーザーID                 |
| chat_room_id | INT           | NOT NULL, FK                     | 投稿先のチャットルームID           |
| created_at   | DATETIME      | NOT NULL, DEFAULT CURRENT_TIMESTAMP | レコード作成日時               |

**リレーション:**
- `user` (N:1) - 投稿者への参照
- `chat_room` (N:1) - 投稿先チャットルームへの参照

### 3.4 channel_members テーブル

チャンネルメンバーシップを管理するテーブル。ユーザーとチャットルームの中間テーブル。

| カラム名             | 型                           | 制約                                | 備考                               |
|---------------------|------------------------------|-------------------------------------|------------------------------------|
| id                  | INT                          | PK, AUTO_INCREMENT, NOT NULL        | 主キー、自動採番                   |
| user_id             | INT                          | NOT NULL, FK                        | メンバーのユーザーID               |
| chat_room_id        | INT                          | NOT NULL, FK                        | 参加先のチャットルームID           |
| role                | ENUM('OWNER','ADMIN','MEMBER')| NOT NULL, DEFAULT 'MEMBER'         | チャンネル内での役割               |
| is_starred          | BOOLEAN                      | NOT NULL, DEFAULT FALSE             | スター付きフラグ                   |
| joined_at           | DATETIME                     | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 参加日時                           |
| last_read_at        | DATETIME                     | NULLABLE                            | 最終既読日時                       |
| last_read_message_id| INT                          | NULLABLE                            | 最終既読メッセージID               |

**リレーション:**
- `user` (N:1) - メンバーユーザーへの参照
- `chat_room` (N:1) - 参加チャンネルへの参照

**ユニーク制約:**
- `(user_id, chat_room_id)` - 同一ユーザーが同一チャンネルに複数回参加することを防止

---

## 4. リレーション定義

### 4.1 外部キー制約

| 制約名                           | テーブル        | カラム             | 参照先テーブル | 参照先カラム | ON DELETE  | ON UPDATE |
|---------------------------------|----------------|-------------------|---------------|-------------|------------|-----------|
| fk_messages_user_id             | messages       | user_id           | users         | id          | CASCADE    | CASCADE   |
| fk_messages_chat_room_id        | messages       | chat_room_id      | chat_rooms    | id          | CASCADE    | CASCADE   |
| fk_chat_rooms_created_by        | chat_rooms     | created_by_user_id| users         | id          | SET NULL   | CASCADE   |
| fk_channel_members_user_id      | channel_members| user_id           | users         | id          | CASCADE    | (default) |
| fk_channel_members_chat_room_id | channel_members| chat_room_id      | chat_rooms    | id          | CASCADE    | (default) |

### 4.2 ON DELETE / ON UPDATE ポリシー

- **ON DELETE CASCADE**
  - ユーザーが削除された場合、そのユーザーの全メッセージも削除
  - チャットルームが削除された場合、そのルーム内の全メッセージも削除
  - ユーザーが削除された場合、そのユーザーの全メンバーシップも削除
  - チャットルームが削除された場合、そのルームの全メンバーシップも削除

- **ON DELETE SET NULL**
  - チャンネル作成者が削除された場合、`created_by_user_id` は NULL に設定（チャンネル自体は残る）

- **ON UPDATE CASCADE**
  - 親テーブルの主キーが更新された場合、子テーブルの外部キーも連動して更新

---

## 5. インデックス定義

### 5.1 主キーインデックス（自動生成）

| テーブル名       | インデックス名 | カラム | 種類    |
|-----------------|---------------|--------|---------|
| users           | PRIMARY       | id     | PRIMARY |
| chat_rooms      | PRIMARY       | id     | PRIMARY |
| messages        | PRIMARY       | id     | PRIMARY |
| channel_members | PRIMARY       | id     | PRIMARY |

### 5.2 ユニークインデックス

| テーブル名       | インデックス名                | カラム                   | 種類   | 備考                               |
|-----------------|------------------------------|--------------------------|--------|------------------------------------|
| users           | idx_users_username           | username                 | UNIQUE | ユーザー名の重複防止               |
| users           | idx_users_email              | email                    | UNIQUE | メールアドレスの重複防止           |
| chat_rooms      | idx_chat_rooms_name          | name                     | UNIQUE | チャンネル名の重複防止             |
| channel_members | idx_channel_members_user_room| user_id, chat_room_id    | UNIQUE | 同一ユーザーの重複参加防止         |

### 5.3 外部キーインデックス

| テーブル名       | インデックス名                    | カラム             | 種類  | 備考                         |
|-----------------|----------------------------------|-------------------|-------|------------------------------|
| messages        | idx_messages_user_id             | user_id           | INDEX | ユーザー別メッセージ検索用   |
| messages        | idx_messages_chat_room_id        | chat_room_id      | INDEX | ルーム別メッセージ検索用     |
| chat_rooms      | idx_chat_rooms_created_by        | created_by_user_id| INDEX | 作成者別チャンネル検索用     |
| chat_rooms      | idx_chat_rooms_type              | type              | INDEX | タイプ別チャンネル検索用     |
| channel_members | idx_channel_members_user_id      | user_id           | INDEX | ユーザー別メンバーシップ検索用 |
| channel_members | idx_channel_members_chat_room_id | chat_room_id      | INDEX | チャンネル別メンバー検索用   |

### 5.4 複合インデックス

| テーブル名 | インデックス名               | カラム                    | 種類  | 備考                             |
|-----------|----------------------------|--------------------------|-------|----------------------------------|
| messages  | idx_messages_room_created  | chat_room_id, created_at | INDEX | ルーム内メッセージの時系列取得用 |

---

## 6. 文字コード・照合順序の定義

### 6.1 データベースレベル設定

```sql
CREATE DATABASE chat_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 6.2 テーブルレベル設定

各テーブル作成時に以下を指定:

```sql
CREATE TABLE users (
  -- カラム定義
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

### 6.3 文字コード設定の理由

| 設定項目                | 値                  | 理由                                           |
|------------------------|--------------------|--------------------------------------------|
| CHARACTER SET          | utf8mb4            | 4バイトUTF-8対応（絵文字・特殊文字を格納可能） |
| COLLATE                | utf8mb4_unicode_ci | Unicode標準の照合順序、多言語での正確なソート  |
| ENGINE                 | InnoDB             | トランザクション対応、外部キー制約サポート     |

---

## 7. DDL サンプル（参考）

```sql
-- データベース作成
CREATE DATABASE IF NOT EXISTS chat_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE chat_app;

-- Enum型の定義（MySQL ではカラム定義時に直接指定）

-- users テーブル
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX idx_users_username (username),
  UNIQUE INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- chat_rooms テーブル
CREATE TABLE chat_rooms (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  created_by_user_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type ENUM('PUBLIC', 'PRIVATE', 'DM') NOT NULL DEFAULT 'PUBLIC',
  description VARCHAR(500) NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX idx_chat_rooms_name (name),
  INDEX idx_chat_rooms_created_by (created_by_user_id),
  INDEX idx_chat_rooms_type (type),
  CONSTRAINT fk_chat_rooms_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- messages テーブル
CREATE TABLE messages (
  id INT NOT NULL AUTO_INCREMENT,
  content TEXT NOT NULL,
  user_id INT NOT NULL,
  chat_room_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_messages_user_id (user_id),
  INDEX idx_messages_chat_room_id (chat_room_id),
  INDEX idx_messages_room_created (chat_room_id, created_at),
  CONSTRAINT fk_messages_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_messages_chat_room_id
    FOREIGN KEY (chat_room_id) REFERENCES chat_rooms (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- channel_members テーブル
CREATE TABLE channel_members (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  chat_room_id INT NOT NULL,
  role ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_read_at DATETIME NULL,
  last_read_message_id INT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX idx_channel_members_user_room (user_id, chat_room_id),
  INDEX idx_channel_members_user_id (user_id),
  INDEX idx_channel_members_chat_room_id (chat_room_id),
  CONSTRAINT fk_channel_members_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_channel_members_chat_room_id
    FOREIGN KEY (chat_room_id) REFERENCES chat_rooms (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 8. ER図（概念）

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│   users     │       │   chat_rooms     │       │  messages   │
├─────────────┤       ├──────────────────┤       ├─────────────┤
│ id (PK)     │──┐    │ id (PK)          │──┐    │ id (PK)     │
│ username    │  │    │ name             │  │    │ content     │
│ email       │  │    │ created_by_user_id│◄─┘   │ user_id (FK)│◄──┐
│ password    │  │    │ created_at       │  │    │ chat_room_id│◄──┼──┐
│ created_at  │  │    │ type             │  │    │ created_at  │   │  │
└─────────────┘  │    │ description      │  │    └─────────────┘   │  │
                 │    └──────────────────┘  │                       │  │
                 │            ▲             │                       │  │
                 │            │             │                       │  │
                 │    ┌───────┴──────────┐  │                       │  │
                 │    │ channel_members  │  │                       │  │
                 │    ├──────────────────┤  │                       │  │
                 │    │ id (PK)          │  │                       │  │
                 └───►│ user_id (FK)     │──┘                       │  │
                      │ chat_room_id (FK)│───────────────────────────┘  │
                      │ role             │                              │
                      │ is_starred       │                              │
                      │ joined_at        │                              │
                      │ last_read_at     │                              │
                      │ last_read_message_id │                          │
                      └──────────────────┘                              │
                                                                        │
                 ┌──────────────────────────────────────────────────────┘
                 │
                 ▼
          users.id ──► messages.user_id
          chat_rooms.id ──► messages.chat_room_id
```

**リレーション概要:**
- `users` 1:N `messages` - ユーザーは複数のメッセージを投稿可能
- `users` 1:N `chat_rooms` (created_by) - ユーザーは複数のチャンネルを作成可能
- `users` 1:N `channel_members` - ユーザーは複数のチャンネルに参加可能
- `chat_rooms` 1:N `messages` - チャンネルには複数のメッセージが存在
- `chat_rooms` 1:N `channel_members` - チャンネルには複数のメンバーが存在
