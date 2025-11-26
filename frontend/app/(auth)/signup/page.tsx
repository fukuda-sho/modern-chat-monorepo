/**
 * サインアップページ
 */

import Link from 'next/link';
import { SignupForm, AuthCard } from '@/features/auth';

export default function SignupPage() {
  return (
    <AuthCard title="Chat App" description="新規アカウント作成">
      <SignupForm />
      <div className="mt-4 text-center text-sm">
        <span className="text-muted-foreground">
          すでにアカウントをお持ちですか？
        </span>{' '}
        <Link href="/login" className="text-primary hover:underline">
          ログイン
        </Link>
      </div>
    </AuthCard>
  );
}
