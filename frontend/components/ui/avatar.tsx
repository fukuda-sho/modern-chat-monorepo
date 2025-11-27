/**
 * @fileoverview アバターコンポーネント
 * @description Radix UI Avatar をベースにしたユーザーアバター表示コンポーネント
 * 画像表示とフォールバック（イニシャル等）に対応
 */

'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

/**
 * アバターコンテナコンポーネント
 * @param props - Radix UI Avatar.Root の props
 * @returns アバターコンテナの JSX 要素
 */
function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    />
  );
}

/**
 * アバター画像コンポーネント
 * @param props - Radix UI Avatar.Image の props
 * @returns アバター画像の JSX 要素
 */
function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  );
}

/**
 * アバターフォールバックコンポーネント
 * 画像が読み込めない場合やない場合に表示
 * @param props - Radix UI Avatar.Fallback の props
 * @returns アバターフォールバックの JSX 要素
 */
function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
