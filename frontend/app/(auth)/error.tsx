'use client';

/**
 * 認証ページ用エラーページ
 * ログイン・サインアップページでのエラー表示
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toAppError, logError } from '@/lib/errors';

interface AuthErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthError({
  error,
  reset,
}: AuthErrorProps): React.JSX.Element {
  const appError = toAppError(error);

  useEffect(() => {
    logError(appError, 'AuthError');
  }, [appError]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-destructive">
          認証エラーが発生しました
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{appError.message}</p>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="max-w-md rounded-md bg-muted p-3 font-mono text-xs">
          <div>Tag: {appError._tag}</div>
          <div>Category: {appError.category}</div>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          再試行
        </Button>
        <Button onClick={() => (window.location.href = '/login')} variant="outline">
          ログインページへ
        </Button>
      </div>
    </div>
  );
}
