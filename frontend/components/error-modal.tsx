'use client';

/**
 * エラーモーダルコンポーネント
 * 重大なエラー（critical severity）を表示
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useErrorStore } from '@/lib/errors/error-store';
import type { AppError } from '@/lib/errors';

interface ErrorModalProps {
  /** 閉じる時のコールバック */
  onClose?: () => void;
  /** 再試行ボタンのコールバック */
  onRetry?: () => void;
}

/**
 * エラーモーダル
 * useErrorStore と連携して重大エラーを表示
 *
 * @example
 * // providers/index.tsx に配置
 * <ErrorModal />
 */
export function ErrorModal({ onClose, onRetry }: ErrorModalProps): React.JSX.Element {
  const { modalError, isModalOpen, closeModal } = useErrorStore();

  const handleClose = () => {
    closeModal();
    onClose?.();
  };

  const handleRetry = () => {
    closeModal();
    onRetry?.();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            {getErrorTitle(modalError)}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {modalError?.message}
          </DialogDescription>
        </DialogHeader>

        {process.env.NODE_ENV === 'development' && modalError && (
          <div className="rounded-md bg-muted p-3 font-mono text-xs">
            <div>Tag: {modalError._tag}</div>
            <div>Category: {modalError.category}</div>
            <div>Retryable: {modalError.retryable ? 'Yes' : 'No'}</div>
            {'statusCode' in modalError && (
              <div>Status: {modalError.statusCode}</div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {modalError?.retryable && onRetry && (
            <Button variant="outline" onClick={handleRetry}>
              再試行
            </Button>
          )}
          <Button onClick={handleClose}>
            {getCloseButtonLabel(modalError)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * エラー種別に応じたタイトルを取得
 */
function getErrorTitle(error: AppError | null): string {
  if (!error) return 'エラー';

  switch (error._tag) {
    case 'AuthError':
      return error.statusCode === 401 ? 'ログインが必要です' : 'アクセス権限エラー';
    case 'NetworkError':
      return '接続エラー';
    case 'ServerError':
      return 'サーバーエラー';
    case 'WebSocketError':
      return '接続エラー';
    default:
      return 'エラーが発生しました';
  }
}

/**
 * エラー種別に応じた閉じるボタンのラベルを取得
 */
function getCloseButtonLabel(error: AppError | null): string {
  if (!error) return '閉じる';

  if (error._tag === 'AuthError' && error.statusCode === 401) {
    return 'ログインページへ';
  }

  return '閉じる';
}

export default ErrorModal;
