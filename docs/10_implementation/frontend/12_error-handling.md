# フロントエンド エラーハンドリング実装

## 概要

エラーハンドリングの統一化実装。Discriminated Unionsによる型安全なエラー処理、Toast/Modal通知、TanStack Query統合を提供。

## ファイル構成

```
frontend/
├── lib/errors/
│   ├── index.ts                  # 再エクスポート
│   ├── types.ts                  # エラー型定義
│   ├── factory.ts                # Factory関数、toAppError()
│   ├── error-store.ts            # Zustandストア（Modal状態）
│   ├── use-error-notification.ts # Toast/Modal通知フック
│   ├── use-mutation-error.ts     # Mutation用フック
│   └── use-query-error.ts        # Query用フック
├── components/
│   ├── error-boundary.tsx        # React Error Boundary
│   └── error-modal.tsx           # 重大エラーModal
└── app/
    ├── error.tsx                 # グローバルエラーページ
    ├── (auth)/error.tsx          # 認証エラーページ
    └── (main)/error.tsx          # メインエリアエラーページ
```

## エラー型システム

### Discriminated Union

```typescript
type AppError =
  | NetworkError     // 接続失敗、タイムアウト
  | AuthError        // 401, 403
  | ValidationError  // 400, フォームエラー
  | NotFoundError    // 404
  | ServerError      // 500+
  | WebSocketError   // Socket.IOエラー
  | UnknownError;    // フォールバック
```

### 型判定

```typescript
// _tagで判別（exhaustive switch）
switch (error._tag) {
  case 'AuthError':
    // error.statusCode が型安全にアクセス可能
    break;
  case 'ValidationError':
    // error.fieldErrors が型安全にアクセス可能
    break;
  // ...
}
```

## 使用方法

### 1. Mutationエラーハンドリング

```typescript
import { useMutationError } from '@/lib/errors';

function LoginForm() {
  const loginMutation = useLogin();
  const { errorMessage, isRetryable, resetError } = useMutationError(loginMutation);

  return (
    <form>
      {/* フォームフィールド */}
      {errorMessage && (
        <p className="text-destructive text-sm">{errorMessage}</p>
      )}
      <Button disabled={loginMutation.isPending}>ログイン</Button>
    </form>
  );
}
```

### 2. Queryエラーハンドリング

```typescript
import { useQueryError } from '@/lib/errors';

function UserProfile() {
  const query = useCurrentUser();
  const { error, errorMessage } = useQueryError(query, {
    autoNotify: true,         // 自動でToast表示
    notifyOn: ['network'],    // ネットワークエラーのみ通知
  });

  if (error) {
    return <ErrorDisplay message={errorMessage} />;
  }
  // ...
}
```

### 3. 手動エラー通知

```typescript
import { useErrorNotification, toAppError } from '@/lib/errors';

function SomeComponent() {
  const { notifyError, showToast, showModal } = useErrorNotification();

  const handleAction = async () => {
    try {
      await someAsyncAction();
    } catch (error) {
      const appError = toAppError(error);
      notifyError(appError);  // Severityに応じてToast or Modal
    }
  };
}
```

## Severity別通知ルール

| Severity | 表示方法 | 自動非表示 | 使用例 |
|----------|---------|-----------|--------|
| `critical` | Modal | なし | 401認証切れ |
| `warning` | Toast | 5秒 | ネットワークエラー、500 |
| `info` | Toast | 3秒 | バリデーション、404 |

## TanStack Query統合

### リトライ設定

`lib/query-client.ts`で以下のリトライ判定を実装:

- **Query**: `NetworkError`/`ServerError`は3回まで自動リトライ
- **Mutation**: `NetworkError`のみ1回リトライ
- **Auth/Validation/NotFound**: リトライしない

### グローバルエラーログ

`QueryCache`と`MutationCache`で全エラーをログ出力（開発環境のみ）。

## Error Boundary

### Next.js error.tsx

各ルートグループに`error.tsx`を配置:

- `app/error.tsx` - グローバル
- `app/(auth)/error.tsx` - 認証ページ
- `app/(main)/error.tsx` - メインエリア（認証エラー時はログインへリダイレクト）

### React Error Boundary

`<ErrorBoundary>`コンポーネントで任意のコンポーネントツリーをラップ可能:

```typescript
<ErrorBoundary
  fallback={(error, reset) => <CustomFallback error={error} reset={reset} />}
  onError={(error) => reportToService(error)}
>
  <SomeComponent />
</ErrorBoundary>
```

## 移行ガイド

### Before（旧パターン）

```typescript
const { mutate, isPending, error } = useLogin();

const getErrorMessage = () => {
  if (error instanceof ApiClientError) {
    if (error.statusCode === 401) return '認証エラー';
    return error.message;
  }
  return '通信エラー';
};
```

### After（新パターン）

```typescript
const loginMutation = useLogin();
const { errorMessage } = useMutationError(loginMutation);

// errorMessageをそのまま表示
{errorMessage && <p>{errorMessage}</p>}
```

## 日本語メッセージ

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

## 今後の拡張（Phase 4）

- Sentry統合（`lib/monitoring.ts`）
- エラーレポート機能
