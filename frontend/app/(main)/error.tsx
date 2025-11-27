'use client';

/**
 * メインエリア用エラーページ
 * 認証済みユーザー向けページでのエラー表示
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toAppError, logError, isErrorTag } from '@/lib/errors';

interface MainErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MainError({
  error,
  reset,
}: MainErrorProps): React.JSX.Element {
  const appError = toAppError(error);

  useEffect(() => {
    logError(appError, 'MainError');
  }, [appError]);

  // 認証エラーの場合はログインページへリダイレクト
  const isAuthError = isErrorTag(appError, 'AuthError');

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-destructive">
          {isAuthError ? 'セッションが切れました' : 'エラーが発生しました'}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{appError.message}</p>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="max-w-md rounded-md bg-muted p-3 font-mono text-xs">
          <div>Tag: {appError._tag}</div>
          <div>Category: {appError.category}</div>
          <div>Severity: {appError.severity}</div>
        </div>
      )}

      <div className="flex gap-3">
        {isAuthError ? (
          <Button
            onClick={() => (window.location.href = '/login')}
            variant="default"
          >
            ログインページへ
          </Button>
        ) : (
          <>
            <Button onClick={reset} variant="default">
              再試行
            </Button>
            <Button onClick={() => (window.location.href = '/')} variant="outline">
              ホームに戻る
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
