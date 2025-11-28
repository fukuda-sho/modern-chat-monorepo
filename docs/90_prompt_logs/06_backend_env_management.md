# 作業ログ: Backend 環境変数・シークレット管理

## 作業日

2025-11-26

---

## 実施した作業の概要

### 1. 環境変数管理方針ドキュメント作成

**ファイル**: `docs/10_implementation/backend/04_backend-env-and-secrets-management.md`

- 環境変数のカテゴリと命名規則の定義
- 開発環境（Docker + .env ファイル）での運用方針
- 本番環境（AWS + Docker）での Secrets / Parameter 管理方針
- Backend コード内での読み取り・バリデーションの方針

### 2. .env.example の更新

**ファイル**: `backend/.env.example`

新しい命名規則に従った環境変数キーを定義:

| カテゴリ   | 環境変数         | 説明                                   |
| ---------- | ---------------- | -------------------------------------- |
| アプリ設定 | `APP_ENV`        | 環境（development/staging/production） |
| アプリ設定 | `APP_LOG_LEVEL`  | ログレベル（debug/info/warn/error）    |
| アプリ設定 | `BACKEND_PORT`   | サーバーポート番号                     |
| DB 設定    | `DATABASE_URL`   | MySQL 接続文字列                       |
| JWT 認証   | `JWT_SECRET`     | JWT 署名用シークレットキー             |
| JWT 認証   | `JWT_EXPIRES_IN` | JWT トークン有効期限                   |

### 3. docker-compose.yml の更新

**ファイル**: `docker-compose.yml`

- backend サービスの `env_file` を `./backend/.env` から `./backend/.env.development` に変更

### 4. Zod のインストール

```bash
yarn add zod
```

### 5. 環境変数バリデーション実装

**ファイル**: `backend/src/config/env.ts`

- Zod スキーマによる環境変数のバリデーション
- 型安全な環境変数アクセス
- ヘルパー関数（`isDevelopment()`, `isProduction()`, `isStaging()`）

**ファイル**: `backend/src/config/index.ts`

- Config モジュールのエクスポート

### 6. .gitignore の更新

**ファイル**: `backend/.gitignore`

- `.env.development`, `.env.staging`, `.env.production` を追加

---

## 重要な設計・仕様上の決定事項

### 命名規則

- 形式: `SCREAMING_SNAKE_CASE`
- 推奨接頭辞:
  - 共通: `APP_`（環境・ログレベルなど）
  - Backend 固有: `BACKEND_`
- 既存変数（`DATABASE_URL`, `JWT_SECRET` 等）は後方互換性のため維持

### ファイル運用方針

| ファイル           | Git 管理 | 用途                     |
| ------------------ | -------- | ------------------------ |
| `.env.example`     | する     | テンプレート（ダミー値） |
| `.env.development` | しない   | 開発環境実際値           |
| `.env.staging`     | しない   | ステージング環境値       |
| `.env.production`  | しない   | 本番環境値               |

### 環境変数バリデーション

```typescript
import { env } from './config/env';

// 型安全にアクセス
const port = env.BACKEND_PORT; // number
const dbUrl = env.DATABASE_URL; // string

// 環境判定
if (isDevelopment()) {
  // 開発環境のみの処理
}
```

---

## 作成・更新ファイル一覧

```
docs/
└── 10_implementation/
    └── backend/
        └── 11_backend-env-and-secrets-management.md  # 新規作成

backend/
├── .env.example          # 更新（新命名規則）
├── .env                   # 更新（新環境変数追加）
├── .gitignore            # 更新（.env.development 等追加）
├── package.json          # 更新（zod 追加）
└── src/
    └── config/
        ├── env.ts        # 新規作成
        └── index.ts      # 新規作成

docker-compose.yml        # 更新（env_file パス変更）
```

---

## 使用ライブラリ

| パッケージ | バージョン | 用途                   |
| ---------- | ---------- | ---------------------- |
| zod        | ^4.1.13    | 環境変数バリデーション |

---

## 今後の対応

1. **既存コードの env.ts 移行**

   - `process.env.JWT_SECRET` → `env.JWT_SECRET`
   - `process.env.DATABASE_URL` → `env.DATABASE_URL`
   - `process.env.PORT` → `env.BACKEND_PORT`

2. **AWS Parameter Store / Secrets Manager 設定**

   - 本番用の値を登録
   - ECS タスク定義から参照

3. **CI/CD での環境変数管理**
   - GitHub Actions Secrets との連携
