/**
 * @fileoverview サインアップページ
 * @description 新規ユーザーがアカウントを作成するためのページ
 */

import Link from 'next/link';
import { SignupForm, AuthCard } from '@/features/auth';

/**
 * サインアップページコンポーネント
 * ユーザー名、メールアドレス、パスワードによる新規登録フォームを表示する
 * ログインページへのリンクも提供
 *
 * @returns サインアップページの JSX 要素
 */
export default function SignupPage(): React.JSX.Element {
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
