/**
 * 認証ガードコンポーネント
 * 未認証の場合はログインページにリダイレクト
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '../hooks/use-current-user';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * ローディングスピナーコンポーネント
 */
function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
    </div>
  );
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { data: user, isLoading, error } = useCurrentUser();
  // Hydration エラー防止: クライアントでマウントされるまでローディング表示
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
