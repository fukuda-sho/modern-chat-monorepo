/**
 * @fileoverview メインページ用レイアウト（認証必須）
 * @description ログイン後のメインアプリケーション用レイアウト
 * AuthGuard で認証状態を確認し、MainLayout でヘッダー・サイドバーを提供する
 */

'use client';

import { AuthGuard } from '@/features/auth';
import { MainLayout } from '@/components/layout/main-layout';

/** メイングループレイアウトの Props 型 */
type MainGroupLayoutProps = {
  /** 子コンテンツ（チャットページなど） */
  children: React.ReactNode;
};

/**
 * メインページグループのレイアウトコンポーネント
 * クライアントコンポーネントとして実装（AuthGuard が localStorage を使用するため）
 * 未認証の場合はログインページにリダイレクトされる
 *
 * @param props - レイアウト用 props
 * @returns メインレイアウトの JSX 要素
 */
export default function MainGroupLayout({ children }: MainGroupLayoutProps): React.JSX.Element {
  return (
    <AuthGuard>
      <MainLayout>{children}</MainLayout>
    </AuthGuard>
  );
}
