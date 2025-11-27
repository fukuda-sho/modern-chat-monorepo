/**
 * エラー状態管理ストア
 * Zustand を使用したグローバルエラー状態管理
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AppError } from './types';

interface ErrorState {
  /** 現在表示中のモーダルエラー */
  modalError: AppError | null;
  /** モーダル表示中かどうか */
  isModalOpen: boolean;
}

interface ErrorActions {
  /** モーダルエラーを表示 */
  showModalError: (error: AppError) => void;
  /** モーダルを閉じる */
  closeModal: () => void;
  /** エラー状態をリセット */
  reset: () => void;
}

type ErrorStore = ErrorState & ErrorActions;

const initialState: ErrorState = {
  modalError: null,
  isModalOpen: false,
};

/**
 * エラー状態管理ストア
 *
 * @example
 * // エラーモーダルを表示
 * useErrorStore.getState().showModalError(error);
 *
 * // コンポーネント内で状態を取得
 * const { modalError, isModalOpen, closeModal } = useErrorStore();
 */
export const useErrorStore = create<ErrorStore>()(
  devtools(
    (set) => ({
      ...initialState,

      showModalError: (error) =>
        set(
          { modalError: error, isModalOpen: true },
          false,
          'showModalError'
        ),

      closeModal: () =>
        set(
          { isModalOpen: false },
          false,
          'closeModal'
        ),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'error-store' }
  )
);
