# 認証システム設計書

## 1. 認証フロー

### 1.1 全体シーケンス

```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌────────┐
│ Client │     │ NestJS  │     │  Prisma  │     │ MySQL  │
└───┬────┘     └────┬────┘     └────┬─────┘     └───┬────┘
    │               │               │               │
    │ ═══════════ SIGNUP ═══════════════════════════│
    │ POST /auth/signup              │               │
    │ {email, password, username}    │               │
    │──────────────>│               │               │
    │               │ bcrypt.hash() │               │
    │               │───────┐       │               │
    │               │<──────┘       │               │
    │               │ create user   │               │
    │               │──────────────>│──────────────>│
    │               │<──────────────│<──────────────│
    │ {id, email, username}         │               │
    │<──────────────│               │               │
    │               │               │               │
    │ ═══════════ LOGIN ════════════════════════════│
    │ POST /auth/login               │               │
    │ {email, password}              │               │
    │──────────────>│               │               │
    │               │ find user     │               │
    │               │──────────────>│──────────────>│
    │               │<──────────────│<──────────────│
    │               │ bcrypt.compare()              │
    │               │───────┐       │               │
    │               │<──────┘       │               │
    │               │ jwt.sign()    │               │
    │               │───────┐       │               │
    │               │<──────┘       │               │
    │ {accessToken} │               │               │
    │<──────────────│               │               │
    │               │               │               │
    │ ═══════════ PROTECTED ROUTE ══════════════════│
    │ GET /users/me                  │               │
    │ Authorization: Bearer <token>  │               │
    │──────────────>│               │               │
    │               │ JwtStrategy.validate()        │
    │               │───────┐       │               │
    │               │<──────┘       │               │
    │               │ find user     │               │
    │               │──────────────>│──────────────>│
    │               │<──────────────│<──────────────│
    │ {id, email, username}         │               │
    │<──────────────│               │               │
```

### 1.2 各ステップの詳細

#### Step 1: Signup（新規ユーザ登録）

1. クライアントが `POST /auth/signup` に `email`, `password`, `username` を送信
2. サーバーで `email` の重複チェックを実施
3. `bcrypt` でパスワードをハッシュ化（salt rounds: 10）
4. Prisma 経由で `users` テーブルにレコード作成
5. `password` を除いたユーザ情報をレスポンス

#### Step 2: Login（ログイン）

1. クライアントが `POST /auth/login` に `email`, `password` を送信
2. `email` でユーザを検索（存在しなければ 401 エラー）
3. `bcrypt.compare` で平文パスワードとハッシュ値を比較（不一致なら 401 エラー）
4. 認証成功時、JWT を発行
   - Payload: `{ sub: user.id, email: user.email }`
   - 有効期限: 環境変数 `JWT_EXPIRES_IN` で指定（デフォルト: 1h）
5. `{ accessToken: string }` をレスポンス

#### Step 3: Protected Route（認証必須エンドポイント）

1. クライアントが `Authorization: Bearer <token>` ヘッダ付きでリクエスト
2. `JwtAuthGuard` が JWT を検証
3. `JwtStrategy.validate()` で payload からユーザ情報を取得し `request.user` に設定
4. Controller でユーザ情報を利用してレスポンス

---

## 2. API エンドポイント定義

### 2.1 POST /auth/signup

新規ユーザ登録

| 項目 | 内容 |
|------|------|
| Method | POST |
| URL | `/auth/signup` |
| Auth | 不要 |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "john_doe"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "createdAt": "2025-11-25T00:00:00.000Z"
}
```

**Error Response (409 Conflict):**
```json
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}
```

### 2.2 POST /auth/login

ログイン

| 項目 | 内容 |
|------|------|
| Method | POST |
| URL | `/auth/login` |
| Auth | 不要 |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 2.3 GET /users/me

ログイン中のユーザ情報取得

| 項目 | 内容 |
|------|------|
| Method | GET |
| URL | `/users/me` |
| Auth | Bearer Token (JWT) |

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "createdAt": "2025-11-25T00:00:00.000Z"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 3. ディレクトリ構成

```
backend/
├── prisma/
│   └── schema.prisma          # Prisma スキーマ定義
├── src/
│   ├── auth/                  # 認証モジュール
│   │   ├── dto/
│   │   │   ├── signup.dto.ts
│   │   │   └── login.dto.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── users/                 # ユーザモジュール
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── prisma/                # Prisma モジュール
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts          # ルートモジュール
│   └── main.ts                # エントリポイント
├── .env                       # 環境変数
├── .env.example               # 環境変数サンプル
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### 3.1 モジュール役割

| モジュール | 役割 |
|-----------|------|
| `AuthModule` | 認証関連（signup, login, JWT戦略, Guard）を束ねる |
| `UsersModule` | ユーザ情報取得ロジック（/users/me など） |
| `PrismaModule` | PrismaClient をラップし、DBアクセスを提供（@Global） |

### 3.2 主要コンポーネント

| コンポーネント | 配置 | 役割 |
|---------------|------|------|
| JwtStrategy | `auth/strategies/` | JWT の検証と payload の解析 |
| JwtAuthGuard | `auth/guards/` | 認証必須エンドポイントの保護 |
| AuthService | `auth/` | signup, login のビジネスロジック |
| AuthController | `auth/` | `/auth/*` エンドポイントの定義 |
| UsersService | `users/` | ユーザ情報取得ロジック |
| UsersController | `users/` | `/users/*` エンドポイントの定義 |
| PrismaService | `prisma/` | PrismaClient のラッパー |

---

## 4. 環境変数

`.env` で管理する項目:

| 変数名 | 説明 | 例 |
|-------|------|-----|
| DATABASE_URL | MySQL 接続文字列 | `mysql://user:pass@localhost:3306/chat_app` |
| JWT_SECRET | JWT 署名用秘密鍵 | `your-super-secret-key` |
| JWT_EXPIRES_IN | JWT 有効期限 | `1h`, `7d`, `30d` |

---

## 5. エラーハンドリング

| シナリオ | ステータスコード | メッセージ |
|---------|-----------------|-----------|
| メールアドレス重複 | 409 Conflict | Email already exists |
| ユーザが見つからない | 401 Unauthorized | Invalid credentials |
| パスワード不一致 | 401 Unauthorized | Invalid credentials |
| JWT 無効/期限切れ | 401 Unauthorized | Unauthorized |
| バリデーションエラー | 400 Bad Request | Validation failed |
