# 07. Backend 単体テスト環境導入設計書（NestJS / Jest）

## 0. ファイル情報

- パス: `docs/10_implementation/backend/07_backend-testing-setup.md`
- 対象: バックエンドアプリケーション（`backend/` ディレクトリ配下）
- 目的:
  - 現状存在しない **ソースコードレベルの単体テスト環境** をバックエンド側（NestJS）に導入する。
  - サービス層 / コントローラ / ガード / パイプ / Prisma 経由のリポジトリなどを、最新のベストプラクティスに近い技術スタックでテストできる状態にする。

---

## 1. 目的・スコープ

### 1.1 目的

- バックエンドの品質と安全なリファクタリングのために、以下を可能にする単体テスト環境を構築する：
  - NestJS の DI（依存性注入）を利用したサービス・コントローラのテスト
  - Prisma クライアントをモックしたビジネスロジックのテスト
  - ガード / パイプ / カスタムデコレータのテスト
- 将来的に CI で「テストが通らない PR はマージさせない」フェーズに移行できるよう基盤を整える。

### 1.2 スコープ

- **含まれるもの**
  - テストランナー・アサーションライブラリの選定と導入（Jest）
  - NestJS 専用テストユーティリティ（`@nestjs/testing`）の利用
  - TypeScript でのテスト実行設定（ts-jest）
  - yarn スクリプト・ディレクトリ構成・サンプルテストの作成

- **含まれないもの**
  - E2E テスト（`@nestjs/testing` + `supertest` など）は別指示書で扱う（ここではユニットテストにフォーカス）
  - フロントエンドのテスト環境（別ドキュメントで既に定義）

---

## 2. 採用するテスト技術スタック

### 2.1 テストランナー / アサーション

- **Jest**
  - 選定理由:
    - NestJS 公式が標準で採用しているテストランナーであり、`@nestjs/testing` と組み合わせた例が豊富。
    - DI コンテナやモジュール単位のテストパターンがドキュメント化されている。
    - モック / スパイ機能（`jest.fn`, `jest.spyOn`）が標準で利用できる。

### 2.2 NestJS テストユーティリティ

- **@nestjs/testing**
  - Nest の DI・モジュールシステムに沿ったテストを書くための公式ユーティリティ。
  - `Test.createTestingModule({ ... })` でテスト用モジュールを構築し、`module.get(MyService)` でインスタンス取得。

---

## 3. ディレクトリ構成と命名規則

### 3.1 テストファイル配置方針

**テストファイルは同階層に `*.spec.ts` として配置**する：

```txt
backend/
  src/
    auth/
      auth.controller.ts
      auth.controller.spec.ts
      auth.service.ts
      auth.service.spec.ts
    chat/
      chat.gateway.ts
      chat.gateway.spec.ts
    prisma/
      prisma.service.ts
      prisma.service.spec.ts
```

### 3.2 命名規則

- テスト対象ファイル名 + `.spec.ts`：
  - `auth.service.ts` → `auth.service.spec.ts`
  - `auth.controller.ts` → `auth.controller.spec.ts`

---

## 4. 依存パッケージ

以下のパッケージが導入済み：

```json
{
  "devDependencies": {
    "@nestjs/testing": "^11.1.9",
    "@types/jest": "^30.0.0",
    "jest": "^30.2.0",
    "ts-jest": "^29.4.5"
  }
}
```

---

## 5. Jest 設定ファイル

`backend/jest.config.ts`:

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/swagger.ts'],
  coverageDirectory: 'coverage',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;
```

---

## 6. テストスクリプト

`backend/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

| コマンド | 説明 |
|----------|------|
| `yarn test` | 全テストを実行 |
| `yarn test:watch` | ウォッチモードで実行 |
| `yarn test:coverage` | カバレッジレポート付きで実行 |

---

## 7. サンプルテスト

### 7.1 サービスのユニットテスト

`auth.service.spec.ts` - PrismaService と JwtService をモックしてテスト：

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        // ... other mocks
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### 7.2 コントローラのユニットテスト

`auth.controller.spec.ts` - サービスをモックしてテスト：

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
```

---

## 8. 実行方法

### Docker 環境

```bash
# テスト実行
docker compose exec backend yarn test

# ウォッチモード
docker compose exec backend yarn test:watch

# カバレッジ付き
docker compose exec backend yarn test:coverage
```

### Makefile

```bash
make test-backend          # yarn test
make test-backend-coverage # yarn test:coverage
```

---

## 9. 完了条件

- [x] `backend` ディレクトリで `yarn test` を実行した際、少なくとも 1 件以上のユニットテストが成功する
- [x] サービス / コントローラ向けのテストのための最低限のサンプルが存在する
- [x] ドキュメントが `docs/10_implementation/backend/` に追加されている
