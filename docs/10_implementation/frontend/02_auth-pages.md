# 認証画面仕様書

## 1. 概要

本ドキュメントは、ログイン画面とサインアップ画面の実装仕様を定義する。

### 1.1 対象画面

| 画面 | パス | 概要 |
|------|------|------|
| ログイン | `/login` | 既存ユーザーの認証 |
| サインアップ | `/signup` | 新規ユーザー登録 |

### 1.2 バックエンド API

| エンドポイント | メソッド | 用途 |
|---------------|---------|------|
| `/auth/login` | POST | ログイン（JWT 取得） |
| `/auth/signup` | POST | ユーザー登録 |
| `/users/me` | GET | 現在のユーザー情報取得 |

---

## 2. 画面設計

### 2.1 共通レイアウト

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│              ┌─────────────────────────────┐                │
│              │                             │                │
│              │         Logo / Title        │                │
│              │                             │                │
│              │    ┌───────────────────┐    │                │
│              │    │                   │    │                │
│              │    │   Form Fields     │    │                │
│              │    │                   │    │                │
│              │    └───────────────────┘    │                │
│              │                             │                │
│              │    [ Submit Button ]        │                │
│              │                             │                │
│              │    Link to other page       │                │
│              │                             │                │
│              └─────────────────────────────┘                │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**デザイン方針:**

- 中央寄せのカード型フォーム
- 背景: グラデーションまたは淡い模様
- カード: `bg-card` + `shadow-lg` + `rounded-xl`
- 余白: 十分なパディング（`p-8`）

### 2.2 ログイン画面

**フィールド:**

| フィールド | タイプ | 必須 | バリデーション |
|-----------|--------|------|---------------|
| メールアドレス | email | Yes | 有効なメール形式 |
| パスワード | password | Yes | 8文字以上 |

**UI 要素:**

```
┌─────────────────────────────────────┐
│                                     │
│           Chat App                  │
│         アカウントにログイン          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ メールアドレス               │    │
│  │ user@example.com            │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ パスワード            [👁]  │    │
│  │ ••••••••                    │    │
│  └─────────────────────────────┘    │
│                                     │
│  [      ログイン      ]             │
│                                     │
│  アカウントをお持ちでないですか？     │
│  サインアップ（リンク）               │
│                                     │
└─────────────────────────────────────┘
```

### 2.3 サインアップ画面

**フィールド:**

| フィールド | タイプ | 必須 | バリデーション |
|-----------|--------|------|---------------|
| ユーザー名 | text | Yes | 3-20文字、英数字とアンダースコア |
| メールアドレス | email | Yes | 有効なメール形式 |
| パスワード | password | Yes | 8文字以上 |
| パスワード確認 | password | Yes | パスワードと一致 |

**UI 要素:**

```
┌─────────────────────────────────────┐
│                                     │
│           Chat App                  │
│        新規アカウント作成            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ユーザー名                   │    │
│  │ john_doe                    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ メールアドレス               │    │
│  │ user@example.com            │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ パスワード            [👁]  │    │
│  │ ••••••••                    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ パスワード（確認）     [👁]  │    │
│  │ ••••••••                    │    │
│  └─────────────────────────────┘    │
│                                     │
│  [     アカウント作成     ]          │
│                                     │
│  すでにアカウントをお持ちですか？     │
│  ログイン（リンク）                  │
│                                     │
└─────────────────────────────────────┘
```

---

## 3. コンポーネント設計

### 3.1 ファイル構成

```
features/auth/
├── components/
│   ├── login-form.tsx
│   ├── signup-form.tsx
│   ├── auth-card.tsx           # 共通カードラッパー
│   ├── password-input.tsx      # パスワード表示切替付き
│   └── auth-guard.tsx          # 認証チェックコンポーネント
├── hooks/
│   ├── use-auth.ts             # 認証状態管理
│   ├── use-login.ts            # ログイン処理
│   ├── use-signup.ts           # サインアップ処理
│   └── use-current-user.ts     # 現在のユーザー取得
├── api/
│   └── auth-api.ts             # API 呼び出し関数
├── schemas/
│   ├── login-schema.ts         # Zod スキーマ
│   └── signup-schema.ts
├── types/
│   └── index.ts
└── index.ts
```

### 3.2 コンポーネント詳細

#### 3.2.1 LoginForm

```typescript
// features/auth/components/login-form.tsx
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

/**
 * ログインフォームコンポーネント
 * - メールアドレスとパスワードでの認証
 * - バリデーションエラー表示
 * - ローディング状態管理
 */
export function LoginForm() {
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
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
          placeholder="パスワードを入力"
          {...form.register('password')}
          aria-invalid={!!form.formState.errors.password}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error.message || 'ログインに失敗しました'}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'ログイン中...' : 'ログイン'}
      </Button>
    </form>
  );
}
```

#### 3.2.2 SignupForm

```typescript
// features/auth/components/signup-form.tsx
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

/**
 * サインアップフォームコンポーネント
 * - ユーザー名、メール、パスワードでの登録
 * - パスワード確認フィールド
 */
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* フォームフィールド */}
    </form>
  );
}
```

#### 3.2.3 PasswordInput

```typescript
// features/auth/components/password-input.tsx
'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * パスワード入力コンポーネント
 * - 表示/非表示切替ボタン付き
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={className}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
```

---

## 4. バリデーションスキーマ

### 4.1 ログインスキーマ

```typescript
// features/auth/schemas/login-schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードは必須です')
    .min(8, 'パスワードは8文字以上で入力してください'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

### 4.2 サインアップスキーマ

```typescript
// features/auth/schemas/signup-schema.ts
import { z } from 'zod';

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(1, 'ユーザー名は必須です')
      .min(3, 'ユーザー名は3文字以上で入力してください')
      .max(20, 'ユーザー名は20文字以内で入力してください')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'ユーザー名は英数字とアンダースコアのみ使用できます'
      ),
    email: z
      .string()
      .min(1, 'メールアドレスは必須です')
      .email('有効なメールアドレスを入力してください'),
    password: z
      .string()
      .min(1, 'パスワードは必須です')
      .min(8, 'パスワードは8文字以上で入力してください'),
    confirmPassword: z.string().min(1, 'パスワード（確認）は必須です'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;
```

---

## 5. API 呼び出し

### 5.1 auth-api.ts

```typescript
// features/auth/api/auth-api.ts
import { apiClient } from '@/lib/api-client';
import type { User } from '@/types';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
}

interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

interface SignupResponse {
  id: number;
  email: string;
  username: string;
  createdAt: string;
}

/**
 * ログイン API
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', data);
}

/**
 * サインアップ API
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  return apiClient.post<SignupResponse>('/auth/signup', data);
}

/**
 * 現在のユーザー取得 API
 */
export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/users/me');
}
```

---

## 6. カスタムフック

### 6.1 useLogin

```typescript
// features/auth/hooks/use-login.ts
import { useMutation } from '@tanstack/react-query';
import { login } from '../api/auth-api';

/**
 * ログイン処理フック
 * - 成功時に JWT をローカルストレージに保存
 */
export function useLogin() {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
    },
  });
}
```

### 6.2 useSignup

```typescript
// features/auth/hooks/use-signup.ts
import { useMutation } from '@tanstack/react-query';
import { signup } from '../api/auth-api';

/**
 * サインアップ処理フック
 */
export function useSignup() {
  return useMutation({
    mutationFn: signup,
  });
}
```

### 6.3 useCurrentUser

```typescript
// features/auth/hooks/use-current-user.ts
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../api/auth-api';

/**
 * 現在のユーザー情報取得フック
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    retry: false,
  });
}
```

---

## 7. ページコンポーネント

### 7.1 ログインページ

```typescript
// app/(auth)/login/page.tsx
import Link from 'next/link';
import { LoginForm } from '@/features/auth';
import { AuthCard } from '@/features/auth/components/auth-card';

export default function LoginPage() {
  return (
    <AuthCard
      title="Chat App"
      description="アカウントにログイン"
    >
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
```

### 7.2 サインアップページ

```typescript
// app/(auth)/signup/page.tsx
import Link from 'next/link';
import { SignupForm } from '@/features/auth';
import { AuthCard } from '@/features/auth/components/auth-card';

export default function SignupPage() {
  return (
    <AuthCard
      title="Chat App"
      description="新規アカウント作成"
    >
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
```

---

## 8. 認証ガード

### 8.1 AuthGuard コンポーネント

```typescript
// features/auth/components/auth-guard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '../hooks/use-current-user';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 認証ガードコンポーネント
 * - 未認証の場合はログインページにリダイレクト
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { data: user, isLoading, error } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      router.push('/login');
    }
  }, [isLoading, error, user, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

---

## 9. エラーハンドリング

| エラー | 表示メッセージ |
|--------|---------------|
| 401 (Login) | メールアドレスまたはパスワードが正しくありません |
| 409 (Signup) | このメールアドレスは既に登録されています |
| Network Error | 通信エラーが発生しました。再度お試しください |
| Validation Error | フィールド下にインラインエラー表示 |

---

## 10. アクセシビリティ

- [ ] すべてのフォームフィールドに `<Label>` を関連付け
- [ ] エラーメッセージを `aria-describedby` で関連付け
- [ ] パスワード表示ボタンに `aria-label` を設定
- [ ] フォーム送信中は `disabled` 状態を視覚的に表示
- [ ] キーボードのみでの操作が可能

---

## 11. 関連ドキュメント

- [00_tech-stack-architecture.md](./00_tech-stack-architecture.md)
- [01_directory-structure.md](./01_directory-structure.md)
- [../backend/01_auth_system.md](../backend/01_auth_system.md) - バックエンド認証仕様
