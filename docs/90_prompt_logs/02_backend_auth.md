# 作業ログ: NestJS バックエンド構築（認証・CRUD）

## 作業日

2025-11-25

---

## 実施した作業の概要

### 1. backend/ フォルダ作成

- 既存の `backend/` ディレクトリに NestJS プロジェクトを構築
- `src/` 配下に各モジュールのディレクトリ構造を作成

### 2. 認証仕様ドキュメント作成

**ファイル**: `docs/10_implementation/backend/01_auth_system.md`

- 認証フロー（Signup → Login → JWT発行 → Protected Route）のシーケンス図
- APIエンドポイント定義（Request/Response Body含む）
- ディレクトリ構成と各モジュールの役割

### 3. PrismaModule の実装

**ファイル**:
- `src/prisma/prisma.module.ts`
- `src/prisma/prisma.service.ts`

- `@Global()` デコレータで全モジュールからアクセス可能に設定
- `OnModuleInit` / `OnModuleDestroy` でDB接続ライフサイクル管理
- Prisma 7 の新構成に対応（`prisma.config.ts` 使用）

### 4. AuthModule の実装

**ファイル**:
- `src/auth/auth.module.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/auth/dto/signup.dto.ts`
- `src/auth/dto/login.dto.ts`
- `src/auth/strategies/jwt.strategy.ts`
- `src/auth/guards/jwt-auth.guard.ts`

- Passport + JWT 戦略によるトークンベース認証
- bcrypt によるパスワードハッシュ化
- class-validator による入力バリデーション

### 5. UsersModule の実装

**ファイル**:
- `src/users/users.module.ts`
- `src/users/users.controller.ts`
- `src/users/users.service.ts`

- `GET /users/me` エンドポイント（JwtAuthGuard 保護）
- ユーザー情報取得時にパスワードを除外

### 6. AppModule と main.ts

**ファイル**:
- `src/app.module.ts`
- `src/main.ts`

- ValidationPipe のグローバル設定
- CORS 有効化

---

## 重要な設計・仕様上の決定事項

### JWT Payload 仕様

```typescript
{
  sub: number;    // ユーザーID
  email: string;  // メールアドレス
}
```

### .env で管理する項目

| 変数名 | 説明 | デフォルト値 |
|-------|------|-------------|
| DATABASE_URL | MySQL接続文字列 | `mysql://chat_user:chat_password@localhost:3306/chat_app` |
| JWT_SECRET | JWT署名用秘密鍵 | `your-super-secret-key-change-in-production` |
| JWT_EXPIRES_IN | JWT有効期限 | `1h` |
| PORT | サーバーポート | `3000` |

### 例外時のステータスコード

| シナリオ | ステータスコード | メッセージ |
|---------|-----------------|-----------|
| メールアドレス重複 | 409 Conflict | Email already exists |
| ユーザー名重複 | 409 Conflict | Username already exists |
| ユーザーが見つからない | 401 Unauthorized | Invalid credentials |
| パスワード不一致 | 401 Unauthorized | Invalid credentials |
| JWT無効/期限切れ | 401 Unauthorized | Unauthorized |
| バリデーションエラー | 400 Bad Request | Validation failed |

---

## 作成ファイル一覧

```
backend/
├── prisma/
│   ├── schema.prisma          # Prisma スキーマ（Prisma 7対応）
│   └── prisma.config.ts       # Prisma 7 設定ファイル
├── src/
│   ├── auth/
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
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 使用ライブラリ

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| @nestjs/common | ^11.1.9 | NestJS コア |
| @nestjs/core | ^11.1.9 | NestJS コア |
| @nestjs/passport | ^11.0.5 | Passport 統合 |
| @nestjs/jwt | ^11.0.1 | JWT 処理 |
| @prisma/client | ^7.0.0 | Prisma ORM |
| passport-jwt | ^4.0.1 | JWT 戦略 |
| bcrypt | ^6.0.0 | パスワードハッシュ |
| class-validator | ^0.14.3 | バリデーション |

---

## 次のステップ

1. **MySQL コンテナ起動**: `docker-compose up -d`
2. **Prisma マイグレーション**: `cd backend && npx prisma migrate dev --name init`
3. **サーバー起動**: `npm run start:dev`
4. **API テスト**:
   - `POST /auth/signup` でユーザー登録
   - `POST /auth/login` でログイン・トークン取得
   - `GET /users/me` で認証済みユーザー情報取得
