/**
 * @fileoverview カードコンポーネント
 * @description コンテンツをグループ化して表示するカード
 * Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter で構成
 */

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * カードコンテナコンポーネント
 * @param props - div の props
 * @returns カードコンテナの JSX 要素
 */
function Card({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
        className
      )}
      {...props}
    />
  );
}

/**
 * カードヘッダーコンポーネント
 * @param props - div の props
 * @returns カードヘッダーの JSX 要素
 */
function CardHeader({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className
      )}
      {...props}
    />
  );
}

/**
 * カードタイトルコンポーネント
 * @param props - div の props
 * @returns カードタイトルの JSX 要素
 */
function CardTitle({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  );
}

/**
 * カード説明文コンポーネント
 * @param props - div の props
 * @returns カード説明文の JSX 要素
 */
function CardDescription({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

/**
 * カードアクションコンポーネント
 * @param props - div の props
 * @returns カードアクションの JSX 要素
 */
function CardAction({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className
      )}
      {...props}
    />
  );
}

/**
 * カードコンテンツコンポーネント
 * @param props - div の props
 * @returns カードコンテンツの JSX 要素
 */
function CardContent({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  );
}

/**
 * カードフッターコンポーネント
 * @param props - div の props
 * @returns カードフッターの JSX 要素
 */
function CardFooter({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
