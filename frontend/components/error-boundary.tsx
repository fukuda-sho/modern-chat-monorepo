'use client';

/**
 * React Error Boundary コンポーネント
 * ランタイムエラーをキャッチして表示
 */

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { toAppError, logError, type AppError } from '@/lib/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** フォールバックUIをカスタマイズ */
  fallback?: ReactNode | ((error: AppError, reset: () => void) => ReactNode);
  /** エラー発生時のコールバック */
  onError?: (error: AppError) => void;
}

interface ErrorBoundaryState {
  error: AppError | null;
}

/**
 * React Error Boundary
 * コンポーネントツリー内のJavaScriptエラーをキャッチ
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = toAppError(error);
    return { error: appError };
  }

  componentDidCatch(error: Error): void {
    const appError = toAppError(error);
    logError(appError, 'ErrorBoundary');
    this.props.onError?.(appError);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      // カスタムフォールバック
      if (typeof fallback === 'function') {
        return fallback(error, this.reset);
      }
      if (fallback) {
        return fallback;
      }

      // デフォルトフォールバック
      return <DefaultErrorFallback error={error} reset={this.reset} />;
    }

    return children;
  }
}

/**
 * デフォルトのエラー表示コンポーネント
 */
function DefaultErrorFallback({
  error,
  reset,
}: {
  error: AppError;
  reset: () => void;
}): ReactNode {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-destructive">
          エラーが発生しました
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="max-w-md rounded-md bg-muted p-3 font-mono text-xs">
          <div>Tag: {error._tag}</div>
          <div>Category: {error.category}</div>
        </div>
      )}

      <Button onClick={reset} variant="outline">
        再試行
      </Button>
    </div>
  );
}

export default ErrorBoundary;
