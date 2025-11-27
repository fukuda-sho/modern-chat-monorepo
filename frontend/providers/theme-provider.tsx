/**
 * @fileoverview テーマプロバイダー
 * @description ダーク/ライト/システムテーマの切り替え機能を提供する
 * next-themes ライブラリを使用し、CSS クラスベースでテーマを適用
 */

'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/** テーマプロバイダーの Props 型 */
type ThemeProviderProps = {
  /** プロバイダーでラップする子コンテンツ */
  children: React.ReactNode;
};

/**
 * テーマプロバイダーコンポーネント
 * クライアントコンポーネントとして next-themes の ThemeProvider をラップ
 * - attribute="class": HTML 要素に class 属性でテーマを適用
 * - defaultTheme="system": デフォルトはシステム設定に従う
 * - enableSystem: システムのダークモード設定を検知
 * - disableTransitionOnChange: テーマ変更時のトランジションを無効化
 *
 * @param props - プロバイダー用 props
 * @returns テーマプロバイダーの JSX 要素
 */
export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
