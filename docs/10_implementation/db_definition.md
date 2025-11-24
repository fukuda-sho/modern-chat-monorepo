# DB定義書

## 1. テーブル一覧

| テーブル名    | 用途                                                       |
|--------------|-----------------------------------------------------------|
| users        | ユーザー情報を管理。認証情報（email, password）を含む      |
| chat_rooms   | チャットルーム情報を管理。ルーム名と作成日時を保持         |
| messages     | チャットメッセージを管理。ユーザーとルームを紐付ける       |

---

## 2. 各テーブルのカラム定義

### 2.1 users テーブル

ユーザーアカウント情報を格納するテーブル。

| カラム名    | 型            | 制約                              | 備考                           |
|------------|---------------|----------------------------------|--------------------------------|
| id         | INT           | PK, AUTO_INCREMENT, NOT NULL     | 主キー、自動採番               |
| username   | VARCHAR(255)  | NOT NULL, UNIQUE                 | ユーザー名（一意制約）         |
| email      | VARCHAR(255)  | NOT NULL, UNIQUE                 | メールアドレス（一意制約）     |
| password   | VARCHAR(255)  | NOT NULL                         | bcrypt等でハッシュ化済みの値   |
| created_at | DATETIME      | NOT NULL, DEFAULT CURRENT_TIMESTAMP | レコード作成日時           |

### 2.2 chat_rooms テーブル

チャットルーム情報を格納するテーブル。

| カラム名    | 型            | 制約                              | 備考                           |
|------------|---------------|----------------------------------|--------------------------------|
| id         | INT           | PK, AUTO_INCREMENT, NOT NULL     | 主キー、自動採番               |
| name       | VARCHAR(255)  | NOT NULL                         | チャットルーム名               |
| created_at | DATETIME      | NOT NULL, DEFAULT CURRENT_TIMESTAMP | レコード作成日時           |

### 2.3 messages テーブル

チャットメッセージを格納するテーブル。

| カラム名      | 型            | 制約                              | 備考                               |
|--------------|---------------|----------------------------------|------------------------------------|
| id           | INT           | PK, AUTO_INCREMENT, NOT NULL     | 主キー、自動採番                   |
| content      | TEXT          | NOT NULL                         | メッセージ本文（長文対応）         |
| user_id      | INT           | NOT NULL, FK                     | 投稿者のユーザーID                 |
| chat_room_id | INT           | NOT NULL, FK                     | 投稿先のチャットルームID           |
| created_at   | DATETIME      | NOT NULL, DEFAULT CURRENT_TIMESTAMP | レコード作成日時               |

---

## 3. リレーション定義

### 3.1 外部キー制約

| 制約名                      | テーブル   | カラム        | 参照先テーブル | 参照先カラム | ON DELETE | ON UPDATE |
|----------------------------|-----------|--------------|---------------|-------------|-----------|-----------|
| fk_messages_user_id        | messages  | user_id      | users         | id          | CASCADE   | CASCADE   |
| fk_messages_chat_room_id   | messages  | chat_room_id | chat_rooms    | id          | CASCADE   | CASCADE   |

### 3.2 ON DELETE / ON UPDATE ポリシー

- **ON DELETE CASCADE**
  - ユーザーが削除された場合、そのユーザーの全メッセージも削除
  - チャットルームが削除された場合、そのルーム内の全メッセージも削除

- **ON UPDATE CASCADE**
  - 親テーブルの主キーが更新された場合、子テーブルの外部キーも連動して更新

---

## 4. インデックス定義

### 4.1 主キーインデックス（自動生成）

| テーブル名   | インデックス名 | カラム | 種類   |
|-------------|---------------|--------|--------|
| users       | PRIMARY       | id     | PRIMARY |
| chat_rooms  | PRIMARY       | id     | PRIMARY |
| messages    | PRIMARY       | id     | PRIMARY |

### 4.2 ユニークインデックス

| テーブル名 | インデックス名         | カラム    | 種類   | 備考                     |
|-----------|----------------------|----------|--------|--------------------------|
| users     | idx_users_username   | username | UNIQUE | ユーザー名の重複防止     |
| users     | idx_users_email      | email    | UNIQUE | メールアドレスの重複防止 |

### 4.3 外部キーインデックス

| テーブル名 | インデックス名              | カラム        | 種類  | 備考                       |
|-----------|---------------------------|--------------|-------|----------------------------|
| messages  | idx_messages_user_id      | user_id      | INDEX | ユーザー別メッセージ検索用 |
| messages  | idx_messages_chat_room_id | chat_room_id | INDEX | ルーム別メッセージ検索用   |

### 4.4 複合インデックス

| テーブル名 | インデックス名                    | カラム                      | 種類  | 備考                           |
|-----------|--------------------------------|----------------------------|-------|--------------------------------|
| messages  | idx_messages_room_created      | chat_room_id, created_at   | INDEX | ルーム内メッセージの時系列取得用 |

---

## 5. 文字コード・照合順序の定義

### 5.1 データベースレベル設定

```sql
CREATE DATABASE chat_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 5.2 テーブルレベル設定

各テーブル作成時に以下を指定:

```sql
CREATE TABLE users (
  -- カラム定義
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

### 5.3 文字コード設定の理由

| 設定項目                | 値                  | 理由                                           |
|------------------------|--------------------|--------------------------------------------|
| CHARACTER SET          | utf8mb4            | 4バイトUTF-8対応（絵文字・特殊文字を格納可能） |
| COLLATE                | utf8mb4_unicode_ci | Unicode標準の照合順序、多言語での正確なソート  |
| ENGINE                 | InnoDB             | トランザクション対応、外部キー制約サポート     |

---

## 6. DDL サンプル（参考）

```sql
-- データベース作成
CREATE DATABASE IF NOT EXISTS chat_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE chat_app;

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
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
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
```
