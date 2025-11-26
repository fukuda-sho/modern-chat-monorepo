/**
 * 認証ガードコンポーネント
 * 未認証の場合はログインページにリダイレクト
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '../hooks/use-current-user';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { data: user, isLoading, error } = useCurrentUser();

  useEffect(() => {
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
  }, [isLoading, error, user, router]);

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  // 未認証
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
