'use client';

/**
 * エラー通知フック
 * Severity に応じた Toast / Modal 通知
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { AppError } from './types';
import { logError } from './factory';
import { useErrorStore } from './error-store';

interface UseErrorNotificationReturn {
  /** エラーを通知（Severity に応じて Toast or Modal） */
  notifyError: (error: AppError) => void;
  /** Toast でエラーを通知 */
  showToast: (error: AppError) => void;
  /** Modal でエラーを通知 */
  showModal: (error: AppError) => void;
}

/**
 * エラー通知フック
 *
 * @example
 * const { notifyError } = useErrorNotification();
 *
 * try {
 *   await apiClient.post('/data', data);
 * } catch (error) {
 *   const appError = toAppError(error);
 *   notifyError(appError);
 * }
 */
export function useErrorNotification(): UseErrorNotificationReturn {
  const showModalError = useErrorStore((state) => state.showModalError);

  /**
   * Toast でエラーを通知
   */
  const showToast = useCallback((error: AppError) => {
    logError(error, 'Toast');

    const duration = error.severity === 'info' ? 3000 : 5000;

    switch (error.severity) {
      case 'info':
        toast.warning(error.message, { duration });
        break;
      case 'warning':
      case 'critical':
        toast.error(error.message, {
          duration: error.severity === 'critical' ? undefined : duration,
          description: error.retryable
            ? '再試行することができます'
            : undefined,
        });
        break;
    }
  }, []);

  /**
   * Modal でエラーを通知
   */
  const showModal = useCallback(
    (error: AppError) => {
      logError(error, 'Modal');
      showModalError(error);
    },
    [showModalError]
  );

  /**
   * Severity に応じた通知
   * - critical: Modal
   * - warning/info: Toast
   */
  const notifyError = useCallback(
    (error: AppError) => {
      if (error.severity === 'critical') {
        showModal(error);
      } else {
        showToast(error);
      }
    },
    [showModal, showToast]
  );

  return {
    notifyError,
    showToast,
    showModal,
  };
}
