# 環境変数の集約管理とCORS設定の最適化

## 概要

アプリケーションの設定管理を一元化し、保守性とセキュリティを向上させるため、NestJSの`@nestjs/config`モジュールを使用した環境変数管理戦略を実装します。

## 現状の課題

### 問題点
1. **設定の散在**: `main.ts`で`process.env`を直接参照し、ハードコードされたデフォルト値が混在
2. **型安全性の欠如**: 環境変数は文字列型のみで、型変換が必要な場合にエラーが発生しやすい
3. **CORS設定の硬直性**: オリジンがハードコードされており、環境ごとの柔軟な設定が困難
4. **テストの困難性**: 環境変数をモックすることが難しい

### 改善の必要性
- 環境変数の一元管理
- 型安全な設定値の取得
- 環境ごとの柔軟な設定
- テスタビリティの向上

## 設計方針

### 1. ConfigModuleの採用

NestJSの公式推奨パッケージ`@nestjs/config`を使用します。

**利点:**
- グローバルな設定管理
- 型安全な設定値の取得
- デフォルト値の定義
- バリデーション機能
- テスト時のモック化が容易

### 2. 設定ファイルの分離

設定ロジックを専用ファイル(`app.config.ts`)に分離します。

**責務:**
- 環境変数の読み込み
- 型変換（文字列 → 数値、文字列 → 配列など）
- デフォルト値の定義
- 設定値の検証

**メリット:**
- 設定ロジックの再利用
- テストの容易性
- 可読性の向上

### 3. main.tsの責務の明確化

`main.ts`は設定値を取得して使用するだけにします。

**Before:**
```typescript
app.enableCors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
});
```

**After:**
```typescript
const configService = app.get(ConfigService);
app.enableCors({
  origin: configService.get<string[]>('cors.origins'),
  credentials: true,
});
```

## 実装詳細

### ディレクトリ構造

```
backend/
├── src/
│   ├── config/
│   │   └── app.config.ts     # アプリケーション設定
│   ├── app.module.ts          # ConfigModule統合
│   └── main.ts                # ConfigService使用
├── .env                       # 環境変数（gitignore）
├── .env.example               # 環境変数のサンプル
└── package.json
```

### 設定ファイル (`app.config.ts`)

```typescript
/**
 * アプリケーション設定
 *
 * 環境変数を読み込み、型付けされたオブジェクトとして返却します。
 * すべての環境変数の変換とデフォルト値の定義をここで行います。
 */
export default () => ({
  /**
   * サーバーポート番号
   * デフォルト: 3000
   */
  port: parseInt(process.env.PORT || '3000', 10),

  /**
   * Node.js実行環境
   * デフォルト: 'development'
   */
  nodeEnv: process.env.NODE_ENV || 'development',

  /**
   * CORS設定
   */
  cors: {
    /**
     * 許可するオリジンのリスト
     *
     * CORS_ALLOWED_ORIGINSをカンマ区切りで指定
     * 例: "http://localhost:3000,http://localhost:3001"
     *
     * 設定がない場合は空配列（すべて拒否）
     */
    origins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) =>
          origin.trim(),
        )
      : [],
  },

  /**
   * データベース設定
   */
  database: {
    url: process.env.DATABASE_URL,
  },

  /**
   * JWT設定
   */
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  /**
   * フロントエンドURL
   */
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
});
```

### AppModule統合

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/app.config';

@Module({
  imports: [
    // グローバルに設定を利用可能にする
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      // 環境変数ファイルのパス
      envFilePath: '.env',
      // 環境変数ファイルが存在しない場合もエラーにしない
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    // 他のモジュール...
  ],
})
export class AppModule {}
```

### main.ts修正

```typescript
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ConfigServiceを取得
  const configService = app.get(ConfigService);

  // 設定値を使用
  app.enableCors({
    origin: configService.get<string[]>('cors.origins'),
    credentials: true,
  });

  const port = configService.get<number>('port');
  await app.listen(port);
}
```

## 環境変数の定義

### .env ファイル (開発環境)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
# カンマ区切りで複数のオリジンを指定
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# Database Configuration
DATABASE_URL=mysql://chat_user:chat_password@localhost:3306/chat_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### .env.example ファイル

```.env
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (comma-separated)
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# Database Configuration
DATABASE_URL=mysql://user:password@localhost:3306/database

# JWT Configuration
JWT_SECRET=change-this-secret-in-production
JWT_EXPIRES_IN=24h

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

## 環境ごとの設定

### 開発環境 (`.env`)
- ローカルホストのオリジンを許可
- デバッグログを有効化
- 開発用のシークレットキー

### 本番環境 (環境変数またはシークレット管理)
- 本番ドメインのみを許可
- ログレベルを制限
- 安全なシークレットキーを使用
- 環境変数ファイルは使用しない（`ignoreEnvFile: true`）

## セキュリティ考慮事項

### 1. シークレットの管理
- `.env`ファイルは`.gitignore`に追加
- 本番環境ではAWS Secrets ManagerやKubernetes Secretsを使用
- シークレットキーは十分に複雑なものを使用

### 2. CORS設定
- 必要最小限のオリジンのみを許可
- ワイルドカード（`*`）は使用しない
- 本番環境では厳格に制限

### 3. デフォルト値
- デフォルト値は安全な設定にする
- 本番環境では必ず環境変数を設定する

## バリデーション

将来的には、`class-validator`と`class-transformer`を使用して設定値のバリデーションを追加することを推奨します。

```typescript
import { IsNumber, IsString, IsArray } from 'class-validator';

export class AppConfig {
  @IsNumber()
  port: number;

  @IsArray()
  @IsString({ each: true })
  corsOrigins: string[];
}
```

## テスト戦略

### 単体テスト
ConfigServiceをモックして、異なる設定値でのテストが可能になります。

```typescript
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'cors.origins') return ['http://test.com'];
    if (key === 'port') return 3000;
  }),
};
```

### E2Eテスト
テスト専用の`.env.test`ファイルを使用します。

## 移行手順

1. `@nestjs/config`パッケージをインストール
2. `config/app.config.ts`を作成
3. `AppModule`に`ConfigModule`を統合
4. `main.ts`を`ConfigService`を使用するように修正
5. `.env`ファイルを作成・設定
6. 既存の`process.env`参照を`ConfigService`に置き換え
7. テストを実行して動作確認

## メリット

### 開発効率の向上
- 設定の一元管理で変更が容易
- 型安全性によるバグの削減
- IDE補完の活用

### 保守性の向上
- 設定ロジックの分離
- ドキュメント化された設定
- コードの可読性向上

### セキュリティの向上
- シークレット管理の明確化
- 環境ごとの適切な設定
- 本番環境での安全な設定

## 参考資料

- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [Best practices for managing secrets](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
