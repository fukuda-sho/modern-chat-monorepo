# API ドキュメント設計書

## 概要

本ドキュメントは、NestJS バックエンドにおける API ドキュメント（Swagger/OpenAPI）の導入方針と設計を定義する。

## 1. ライブラリ選定

### 採用ライブラリ

| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| `@nestjs/swagger` | ^8.x | NestJS 公式 Swagger 統合 |
| `swagger-ui-express` | ^5.x | Swagger UI レンダリング |

### 選定理由

1. **NestJS 公式サポート**: `@nestjs/swagger` は NestJS チームが公式にメンテナンスしており、フレームワークとの親和性が高い
2. **型安全性**: TypeScript デコレータを活用し、DTO クラスから自動的にスキーマを生成
3. **OpenAPI 3.0 準拠**: 業界標準の API 仕様に準拠し、様々なツールとの連携が可能
4. **JWT 認証対応**: `addBearerAuth()` により、認証付き API のテストが容易

## 2. URL 設計と環境分離

### エンドポイント設計

| パス | 説明 |
|------|------|
| `/api/docs` | Swagger UI（インタラクティブなドキュメント） |
| `/api/docs-json` | OpenAPI 3.0 JSON スキーマ |

### 環境制御方針

```
本番環境（NODE_ENV=production）では Swagger UI を無効化する
```

**理由**:
- 内部 API 構造の漏洩防止
- 不要なエンドポイントの削減
- セキュリティリスクの軽減

**実装方法**:
- `swagger.ts` 内で `process.env.NODE_ENV` を参照
- 本番環境以外でのみ `SwaggerModule.setup()` を実行

## 3. ファイル構成方針（責務の分離）

### ディレクトリ構造

```
backend/src/
├── main.ts              # エントリポイント（setupSwagger を呼び出すのみ）
├── swagger.ts           # Swagger 設定ロジック（新規）
├── common/
│   └── dto/
│       ├── index.ts           # 再エクスポート
│       └── api-response.dto.ts # 共通レスポンス DTO
├── auth/
│   ├── auth.controller.ts     # @ApiTags, @ApiOperation 付与
│   └── dto/
│       ├── login.dto.ts       # @ApiProperty 付与
│       └── signup.dto.ts      # @ApiProperty 付与
├── users/
│   └── users.controller.ts    # @ApiTags, @ApiBearerAuth 付与
└── health/
    └── health.controller.ts   # @ApiTags 付与
```

### 責務の分離

| ファイル | 責務 |
|----------|------|
| `main.ts` | アプリケーション起動フローの制御のみ |
| `swagger.ts` | Swagger 設定のカプセル化（DocumentBuilder, SwaggerModule） |
| `common/dto/*.ts` | 共通エラーレスポンスの型定義 |

**メリット**:
- `main.ts` の肥大化を防止
- Swagger 設定の変更が他に影響しない
- テスト時のモック化が容易

## 4. 実装運用ルール

### コントローラ装飾ルール

| デコレータ | 必須/任意 | 説明 |
|-----------|----------|------|
| `@ApiTags()` | **必須** | コントローラのグルーピング |
| `@ApiOperation()` | **必須** | 各エンドポイントの概要 |
| `@ApiResponse()` | **必須** | 正常系・エラー系のレスポンス型 |
| `@ApiBearerAuth()` | 条件付き必須 | JWT 認証が必要なエンドポイント |

### DTO 装飾ルール

| デコレータ | 必須/任意 | 説明 |
|-----------|----------|------|
| `@ApiProperty()` | **必須** | プロパティの説明・例示・必須区分 |

**@ApiProperty の推奨オプション**:
```typescript
@ApiProperty({
  example: 'user@example.com',
  description: 'ユーザーのメールアドレス',
  required: true,  // デフォルト true
})
```

### 共通エラーレスポンス DTO

以下の共通 DTO を定義し、`@ApiResponse` で参照する:

- `ApiErrorResponseDto` - 400 Bad Request
- `UnauthorizedResponseDto` - 401 Unauthorized
- `NotFoundResponseDto` - 404 Not Found
- `ConflictResponseDto` - 409 Conflict

## 5. 動作確認手順

### 起動手順

```bash
# 開発サーバー起動
yarn start:dev
```

### 確認項目

1. **Swagger UI アクセス**
   - URL: `http://localhost:3000/api/docs`
   - 期待: Swagger UI が表示される

2. **API グルーピング確認**
   - `auth`, `users`, `health` タグでグループ化されている

3. **認証フロー確認**
   ```
   1. POST /auth/signup でユーザー作成
   2. POST /auth/login で JWT トークン取得
   3. Swagger UI 右上「Authorize」ボタンをクリック
   4. 「Bearer {token}」形式でトークン入力
   5. GET /users/me が 200 OK を返すことを確認
   ```

4. **リクエストボディ例示確認**
   - 各 POST エンドポイントで「Example Value」が表示される

## 6. 今後の拡張

### 自動 @ApiProperty 付与（nest-cli プラグイン）

`nest-cli.json` に以下を追加することで、DTO プロパティへの `@ApiProperty` 自動付与が可能:

```json
{
  "compilerOptions": {
    "plugins": ["@nestjs/swagger"]
  }
}
```

**注意**: 明示的な `@ApiProperty` が優先されるため、既存コードとの競合はない。

### WebSocket ドキュメント

Socket.IO ベースの WebSocket API は OpenAPI 仕様外のため、以下で対応:
- Swagger UI の description に WebSocket イベント一覧を記載
- 別途 AsyncAPI 仕様でのドキュメント化を検討
