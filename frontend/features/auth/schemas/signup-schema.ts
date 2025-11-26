/**
 * サインアップフォームのバリデーションスキーマ
 */

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
