/**
 * サインアップフォームコンポーネント
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
import { ApiClientError } from '@/lib/api-client';

export function SignupForm() {
  const router = useRouter();
  const { mutate: signup, isPending, error } = useSignup();

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
    signup(
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

  const getErrorMessage = (): string | null => {
    if (!error) return null;
    if (error instanceof ApiClientError) {
      if (error.statusCode === 409) {
        return 'このメールアドレスは既に登録されています';
      }
      return error.message;
    }
    return '通信エラーが発生しました。再度お試しください';
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
          <p className="text-sm text-destructive">
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
          <p className="text-sm text-destructive">
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
          <p className="text-sm text-destructive">
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
          <p className="text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{getErrorMessage()}</p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '登録中...' : 'アカウント作成'}
      </Button>
    </form>
  );
}
