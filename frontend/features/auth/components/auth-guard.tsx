/**
 * @fileoverview 認証ガードコンポーネント
 * @description 認証状態を確認し、未認証の場合はログインページにリダイレクトする
 * クライアントコンポーネントとして localStorage と useCurrentUser フックを使用
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '../hooks/use-current-user';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

/** 認証ガードの Props 型 */
type AuthGuardProps = {
  /** 認証成功時に表示する子コンテンツ */
  children: React.ReactNode;
};

/**
 * ローディングスピナーコンポーネント
 * 認証確認中に表示する全画面ローディング UI
 *
 * @returns ローディングスピナーの JSX 要素
 */
function LoadingSpinner(): React.JSX.Element {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
  );
}

/**
 * 認証ガードコンポーネント
 * クライアントコンポーネントとして localStorage のトークンと API からユーザー情報を確認
 * - マウント前: ローディングスピナー表示（Hydration エラー防止）
 * - トークンなし: /login にリダイレクト
 * - API エラー: トークン削除後 /login にリダイレクト
 * - 認証成功: children を表示
 *
 * @param props - 認証ガード用 props
 * @returns 認証状態に応じた JSX 要素
 */
export function AuthGuard({ children }: AuthGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const { data: user, isLoading, error } = useCurrentUser();
  /** Hydration エラー防止: クライアントでマウントされるまでローディング表示 */
  const [isMounted, setIsMounted] = useState(false);

  // クライアントでのみ実行（Hydration 完了後）
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // マウント前は何もしない
    if (!isMounted) return;

    // トークンがない場合は即座にリダイレクト
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      router.push('/login');
      return;
    }

    // ローディング完了後、エラーまたはユーザーがない場合はリダイレクト
    if (!isLoading && (error || !user)) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      router.push('/login');
    }
  }, [isMounted, isLoading, error, user, router]);

  // サーバーサイド/マウント前は常にローディング表示（Hydration 一致のため）
  if (!isMounted) {
    return <LoadingSpinner />;
  }

  // ローディング中
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 未認証
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
