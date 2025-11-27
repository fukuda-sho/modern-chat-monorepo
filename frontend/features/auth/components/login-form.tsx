/**
 * @fileoverview ログインフォームコンポーネント
 * @description メールアドレスとパスワードによるログインフォーム
 * react-hook-form + Zod でバリデーション、useLogin フックで API 呼び出し
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from './password-input';
import { loginSchema, type LoginFormData } from '../schemas/login-schema';
import { useLogin } from '../hooks/use-login';
import { ApiClientError } from '@/lib/api-client';

/**
 * ログインフォームコンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - メールアドレス・パスワード入力フィールド
 * - Zod スキーマによるリアルタイムバリデーション
 * - ログイン API 呼び出しとエラーハンドリング
 * - ログイン成功時は /chat へリダイレクト
 *
 * @returns ログインフォームの JSX 要素
 */
export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const { mutate: login, isPending, error } = useLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => {
        router.push('/chat');
      },
    });
  };

  const getErrorMessage = (): string | null => {
    if (!error) return null;
    if (error instanceof ApiClientError) {
      if (error.statusCode === 401) {
        return 'メールアドレスまたはパスワードが正しくありません';
      }
      return error.message;
    }
    return '通信エラーが発生しました。再度お試しください';
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          placeholder="パスワードを入力"
          autoComplete="current-password"
          {...form.register('password')}
          aria-invalid={!!form.formState.errors.password}
        />
        {form.formState.errors.password && (
          <p className="text-destructive text-sm">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{getErrorMessage()}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'ログイン中...' : 'ログイン'}
      </Button>
    </form>
  );
}
