/**
 * @fileoverview パスワード入力コンポーネント
 * @description 表示/非表示切替ボタン付きのパスワード入力フィールド
 * forwardRef でフォームライブラリとの統合に対応
 */

'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** パスワード入力の Props 型（HTMLInputElement の属性を継承） */
type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * パスワード入力コンポーネント
 * クライアントコンポーネントとして以下の機能を提供:
 * - パスワードの表示/非表示切り替えボタン
 * - forwardRef による ref 転送（react-hook-form 対応）
 * - アクセシビリティ対応（aria-label 付きトグルボタン）
 *
 * @param props - Input コンポーネントに渡す props
 * @param ref - 入力要素への ref
 * @returns パスワード入力フィールドの JSX 要素
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', className)}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="text-muted-foreground h-4 w-4" />
          ) : (
            <Eye className="text-muted-foreground h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
