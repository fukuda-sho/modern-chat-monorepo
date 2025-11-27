'use client';

/**
 * グローバルエラーページ
 * Next.js App Router のルートレベルエラーハンドラー
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toAppError, logError } from '@/lib/errors';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps): React.JSX.Element {
  const appError = toAppError(error);

  useEffect(() => {
    logError(appError, 'GlobalError');
  }, [appError]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-destructive">
          エラーが発生しました
        </h1>
        <p className="mt-3 text-muted-foreground">{appError.message}</p>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="max-w-lg rounded-md bg-muted p-4 font-mono text-xs">
          <div className="mb-2 font-semibold">Debug Info:</div>
          <div>Tag: {appError._tag}</div>
          <div>Category: {appError.category}</div>
          <div>Severity: {appError.severity}</div>
          {error.digest && <div>Digest: {error.digest}</div>}
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          再試行
        </Button>
        <Button onClick={() => (window.location.href = '/')} variant="outline">
          ホームに戻る
        </Button>
      </div>
    </div>
  );
}
