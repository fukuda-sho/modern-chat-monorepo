/**
 * @fileoverview サインアップフォームコンポーネント
 * @description 新規ユーザー登録用のフォーム
 * react-hook-form + Zod でバリデーション、useSignup フックで API 呼び出し
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from './password-input';
import { signupSchema, type SignupFormData } from '../schemas/signup-schema';
import { useSignup } from '../hooks/use-signup';
import { useMutationError } from '@/lib/errors';

/**
 * サインアップフォームコンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - ユーザー名・メールアドレス・パスワード・確認パスワード入力フィールド
 * - Zod スキーマによるリアルタイムバリデーション（パスワード一致確認含む）
 * - サインアップ API 呼び出しとエラーハンドリング（重複メール検知など）
 * - 登録成功時は /login?registered=true へリダイレクト
 *
 * @returns サインアップフォームの JSX 要素
 */
export function SignupForm(): React.JSX.Element {
  const router = useRouter();
  const signupMutation = useSignup();
  const { errorMessage } = useMutationError(signupMutation);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: SignupFormData) => {
    signupMutation.mutate(
      {
        username: data.username,
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: () => {
          router.push('/login?registered=true');
        },
      }
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">ユーザー名</Label>
        <Input
          id="username"
          type="text"
          placeholder="john_doe"
          autoComplete="username"
          {...form.register('username')}
          aria-invalid={!!form.formState.errors.username}
        />
        {form.formState.errors.username && (
          <p className="text-destructive text-sm">
            {form.formState.errors.username.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          autoComplete="email"
          {...form.register('email')}
          aria-invalid={!!form.formState.errors.email}
        />
        {form.formState.errors.email && (
          <p className="text-destructive text-sm">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">パスワード</Label>
        <PasswordInput
          id="password"
          placeholder="8文字以上のパスワード"
          autoComplete="new-password"
          {...form.register('password')}
          aria-invalid={!!form.formState.errors.password}
        />
        {form.formState.errors.password && (
          <p className="text-destructive text-sm">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">パスワード（確認）</Label>
        <PasswordInput
          id="confirmPassword"
          placeholder="パスワードを再入力"
          autoComplete="new-password"
          {...form.register('confirmPassword')}
          aria-invalid={!!form.formState.errors.confirmPassword}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-destructive text-sm">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      {errorMessage && (
        <p className="text-destructive text-sm">{errorMessage}</p>
      )}

      <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
        {signupMutation.isPending ? '登録中...' : 'アカウント作成'}
      </Button>
    </form>
  );
}
