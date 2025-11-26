/**
 * ログインページ
 */

import Link from 'next/link';
import { LoginForm, AuthCard } from '@/features/auth';

export default function LoginPage() {
  return (
    <AuthCard title="Chat App" description="アカウントにログイン">
      <LoginForm />
      <div className="mt-4 text-center text-sm">
        <span className="text-muted-foreground">
          アカウントをお持ちでないですか？
        </span>{' '}
        <Link href="/signup" className="text-primary hover:underline">
          サインアップ
        </Link>
      </div>
    </AuthCard>
  );
}
