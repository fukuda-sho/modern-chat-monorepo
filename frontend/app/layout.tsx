/**
 * @fileoverview アプリケーションのルートレイアウト
 * @description 全ページ共通のHTML構造、フォント設定、プロバイダーを提供する
 */

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/providers';
import './globals.css';

/** Geist Sans フォント設定 */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

/** Geist Mono フォント設定 */
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/** ページメタデータ */
export const metadata: Metadata = {
  title: 'Chat App',
  description: 'リアルタイムチャットアプリケーション',
};

/** ルートレイアウトの Props 型 */
type RootLayoutProps = Readonly<{
  /** 子コンテンツ */
  children: React.ReactNode;
}>;

/**
 * アプリケーションのルートレイアウトコンポーネント
 * HTML構造、フォント適用、全体プロバイダーのラップを担当する
 *
 * @param props - レイアウト用 props
 * @returns ルートレイアウトの JSX 要素
 */
export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
