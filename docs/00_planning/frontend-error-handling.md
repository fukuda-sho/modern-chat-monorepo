# Frontend エラーハンドリング アーキテクチャ設計

## 概要

Next.js 16 フロントエンドにおけるエラーハンドリングの統一化設計。
型安全性と開発者体験を重視しつつ、段階的に導入可能なアーキテクチャ。

---

## 設計方針

| 方針 | 選択 | 理由 |
|------|------|------|
| 型システム | Discriminated Unions | 網羅的パターンマッチングと自動補完 |
| 通知方式 | Toast + Modal併用 | 重大エラーはModal、軽微はToast |
| 監視サービス | Sentry（段階的導入） | Next.js公式サポート、無料枠あり |
| リトライ | TanStack Query活用 | 既存設定を拡張、カテゴリ別制御 |
| 導入戦略 | 段階的 | 既存コードへの影響を最小化 |

---

## 1. エラー型定義

### 1.1 カテゴリとSeverity

```typescript
// lib/errors/types.ts

export type ErrorSeverity = 'critical' | 'warning' | 'info';

export type ErrorCategory =
  | 'network'      // 接続失敗、タイムアウト
  | 'auth'         // 401, 403, トークン期限切れ
  | 'validation'   // 400, Zodエラー
  | 'notFound'     // 404
  | 'server'       // 500+
  | 'websocket'    // Socket.IOエラー
  | 'unknown';     // フォールバック
```

### 1.2 Discriminated Union型

```typescript
interface BaseAppError {
  readonly _tag: string;           // 判別用タグ
  readonly message: string;        // ユーザー向けメッセージ（日本語）
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly timestamp: number;
  readonly retryable: boolean;
  readonly originalError?: unknown; // 開発環境のみ
}

// 各エラー型
export interface NetworkError extends BaseAppError {
  readonly _tag: 'NetworkError';
  readonly category: 'network';
}

export interface AuthError extends BaseAppError {
  readonly _tag: 'AuthError';
  readonly category: 'auth';
  readonly statusCode: 401 | 403;
}

export interface ValidationError extends BaseAppError {
  readonly _tag: 'ValidationError';
  readonly category: 'validation';
  readonly fieldErrors?: Record<string, string[]>;
}

export interface NotFoundError extends BaseAppError {
  readonly _tag: 'NotFoundError';
  readonly category: 'notFound';
}

export interface ServerError extends BaseAppError {
  readonly _tag: 'ServerError';
  readonly category: 'server';
  readonly statusCode: number;
}

export interface WebSocketError extends BaseAppError {
  readonly _tag: 'WebSocketError';
  readonly category: 'websocket';
  readonly reason: 'connection_failed' | 'disconnected' | 'timeout' | 'auth_failed';
}

export interface UnknownError extends BaseAppError {
  readonly _tag: 'UnknownError';
  readonly category: 'unknown';
}

export type AppError =
  | NetworkError
  | AuthError
  | ValidationError
  | NotFoundError
  | ServerError
  | WebSocketError
  | UnknownError;
```

---

## 2. 通知ルール

### 2.1 Severity別の表示方法

| Severity | 表示方法 | 自動非表示 | 用途 |
|----------|----------|-----------|------|
| `critical` | **Modal** | なし | 401認証切れ、決定的なエラー |
| `warning` | Toast (error) | 5秒 | ネットワークエラー、500エラー |
| `info` | Toast (warning) | 3秒 | バリデーション、404 |

### 2.2 カテゴリ別のデフォルト設定

| Category | Default Severity | Retryable | 表示方法 |
|----------|-----------------|-----------|---------|
| `network` | warning | true | Toast |
| `auth` (401) | critical | false | Modal |
| `auth` (403) | warning | false | Toast |
| `validation` | info | false | インライン/Toast |
| `notFound` | info | false | Toast |
| `server` | warning | true | Toast |
| `websocket` | warning | true | Toast |

---

## 3. 開発者向けルール

### RULE-001: エラーの作成

```typescript
// ❌ BAD: 生のErrorをthrow
throw new Error('Something went wrong');

// ✅ GOOD: Factory関数を使用
throw createValidationError('入力内容を確認してください');
```

### RULE-002: エラーの変換

```typescript
// ❌ BAD: 手動でinstanceof判定
if (error instanceof ApiClientError) {
  if (error.statusCode === 401) { ... }
}

// ✅ GOOD: toAppError()で統一変換
const appError = toAppError(error);
switch (appError._tag) {
  case 'AuthError': ...
  case 'NetworkError': ...
}
```

### RULE-003: Mutation エラーハンドリング

```typescript
// ✅ GOOD: useMutationErrorフックを使用
const mutation = useLogin();
const { error, errorMessage } = useMutationError(mutation);

// UIでの表示
{error && <ErrorMessage>{errorMessage}</ErrorMessage>}
```

### RULE-004: フォームバリデーションエラー

```typescript
// ✅ GOOD: インラインエラー表示
// react-hook-formのフィールドエラーはToastではなくインライン表示
{form.formState.errors.email && (
  <p className="text-destructive text-sm">
    {form.formState.errors.email.message}
  </p>
)}

// APIからの400エラーもフォーム上部にインライン表示
```

### RULE-005: 網羅的エラーハンドリング

```typescript
// ✅ GOOD: switch文で全ケースを網羅
function getErrorAction(error: AppError): string {
  switch (error._tag) {
    case 'NetworkError': return '接続を確認してください';
    case 'AuthError': return 'ログインしてください';
    case 'ValidationError': return '入力を確認してください';
    case 'NotFoundError': return '見つかりませんでした';
    case 'ServerError': return 'しばらくお待ちください';
    case 'WebSocketError': return '再接続中...';
    case 'UnknownError': return 'エラーが発生しました';
    default:
      const _exhaustive: never = error;
      return _exhaustive; // コンパイルエラーで漏れを検出
  }
}
```

### RULE-006: リトライ可能なエラー

```typescript
// retryable: true のエラーのみ再試行UIを表示
{error?.retryable && (
  <Button onClick={() => mutation.mutate(variables)}>
    再試行
  </Button>
)}
```

---

## 4. リトライ戦略

### 4.1 TanStack Query設定

```typescript
// lib/query-client.ts

function shouldRetry(failureCount: number, error: unknown): boolean {
  const appError = toAppError(error);

  // 認証・バリデーションエラーはリトライしない
  if (appError._tag === 'AuthError') return false;
  if (appError._tag === 'ValidationError') return false;
  if (appError._tag === 'NotFoundError') return false;

  // リトライ可能なエラーは3回まで
  return appError.retryable && failureCount < 3;
}
```

### 4.2 リトライ設定一覧

| 対象 | 最大回数 | 遅延パターン |
|------|---------|-------------|
| Query (network) | 3 | 指数バックオフ (1s, 2s, 4s) |
| Query (server) | 3 | 指数バックオフ |
| Mutation (network) | 1 | 固定 2s |
| WebSocket | 10 | 指数バックオフ (既存実装維持) |

---

## 5. 監視サービス

### Phase 1: コンソールログ（即時）

```typescript
// 開発環境での構造化ログ
if (process.env.NODE_ENV === 'development') {
  console.group(`[Error] ${error._tag}`);
  console.log('Category:', error.category);
  console.log('Severity:', error.severity);
  console.log('Message:', error.message);
  console.groupEnd();
}
```

### Phase 4: Sentry導入（将来）

```typescript
// lib/monitoring.ts（将来的に追加）
export function reportError(error: AppError): void {
  if (error.severity === 'info') return; // 軽微なエラーは送信しない

  Sentry.withScope((scope) => {
    scope.setTag('error.tag', error._tag);
    scope.setTag('error.category', error.category);
    Sentry.captureException(error.originalError ?? error);
  });
}
```

---

## 6. ファイル構成

```
frontend/
├── lib/
│   └── errors/
│       ├── index.ts                 # 再エクスポート
│       ├── types.ts                 # 型定義
│       ├── factory.ts               # Factory関数 + toAppError()
│       ├── error-store.ts           # Zustandストア（Modalの状態管理）
│       ├── use-error-notification.ts # Toast/Modal通知フック
│       ├── use-mutation-error.ts    # TanStack Query Mutation用
│       └── use-query-error.ts       # TanStack Query Query用
├── components/
│   ├── error-boundary.tsx           # React Error Boundary
│   └── error-modal.tsx              # 重大エラー用Modal
├── app/
│   ├── error.tsx                    # グローバルエラーページ
│   ├── (auth)/error.tsx             # 認証エラーページ
│   └── (main)/error.tsx             # メインエリアエラーページ
└── docs/
    └── 10_implementation/
        └── frontend/
            └── 11_error-handling.md # 実装詳細ドキュメント
```

---

## 7. 実装フェーズ

### Phase 1: 基盤（コア型・Factory・Error Boundary）

| ファイル | 内容 |
|---------|------|
| `lib/errors/types.ts` | 型定義 |
| `lib/errors/factory.ts` | Factory関数、toAppError() |
| `components/error-boundary.tsx` | React Error Boundary |
| `app/error.tsx` | グローバルエラーページ |
| `app/(auth)/error.tsx` | 認証エラーページ |
| `app/(main)/error.tsx` | メインエリアエラーページ |

### Phase 2: 通知システム

| ファイル | 内容 |
|---------|------|
| `lib/errors/use-error-notification.ts` | 通知フック |
| `components/error-modal.tsx` | Modalコンポーネント |
| `lib/errors/error-store.ts` | Modal状態管理 |

### Phase 3: TanStack Query統合 + 既存コード移行

| ファイル | 内容 |
|---------|------|
| `lib/errors/use-mutation-error.ts` | Mutation用フック |
| `lib/errors/use-query-error.ts` | Query用フック |
| `lib/query-client.ts` | shouldRetry関数追加 |
| `features/auth/components/login-form.tsx` | 新パターンに移行 |
| `features/auth/components/signup-form.tsx` | 新パターンに移行 |
| `features/chat/components/create-room-dialog.tsx` | 新パターンに移行 |

### Phase 4: 監視（将来）

- Sentry導入
- エラーレポート機能

---

## 8. 日本語エラーメッセージ一覧

| エラー種別 | デフォルトメッセージ |
|-----------|-------------------|
| NetworkError | ネットワーク接続に失敗しました |
| AuthError (401) | ログインが必要です |
| AuthError (403) | アクセス権限がありません |
| ValidationError | 入力内容に問題があります |
| NotFoundError | リソースが見つかりませんでした |
| ServerError | サーバーエラーが発生しました |
| WebSocketError | 接続が切断されました |
| UnknownError | 予期しないエラーが発生しました |

---

## 9. 変更対象ファイル一覧

### 新規作成

| ファイル | 内容 |
|---------|------|
| `lib/errors/types.ts` | エラー型定義（Discriminated Unions） |
| `lib/errors/factory.ts` | Factory関数、toAppError() |
| `lib/errors/index.ts` | 再エクスポート |
| `lib/errors/error-store.ts` | Zustand Modal状態管理 |
| `lib/errors/use-error-notification.ts` | 通知フック |
| `lib/errors/use-mutation-error.ts` | Mutation用フック |
| `lib/errors/use-query-error.ts` | Query用フック |
| `components/error-boundary.tsx` | React Error Boundary |
| `components/error-modal.tsx` | 重大エラーModal |
| `app/error.tsx` | グローバルエラーページ |
| `app/(auth)/error.tsx` | 認証エラーページ |
| `app/(main)/error.tsx` | メインエリアエラーページ |

### 既存ファイル変更

| ファイル | 変更内容 |
|---------|---------|
| `lib/api-client.ts` | 変更なし（toAppErrorで吸収） |
| `lib/query-client.ts` | shouldRetry関数追加、QueryCache/MutationCache設定 |
| `lib/socket.ts` | WebSocketError統合、Toast通知追加 |
| `providers/index.tsx` | ErrorBoundary追加 |
| `features/auth/components/login-form.tsx` | 新パターンに移行 |
| `features/auth/components/signup-form.tsx` | 新パターンに移行 |
| `features/chat/components/create-room-dialog.tsx` | 新パターンに移行 |
