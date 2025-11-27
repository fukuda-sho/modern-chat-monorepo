/**
 * @fileoverview 認証ページ用レイアウト
 * @description ログイン・サインアップページ共通のレイアウトを提供する
 */

import { AuthLayout } from '@/components/layout/auth-layout';

/** 認証グループレイアウトの Props 型 */
type AuthGroupLayoutProps = {
  /** 子コンテンツ（ログイン/サインアップフォーム） */
  children: React.ReactNode;
};

/**
 * 認証ページグループのレイアウトコンポーネント
 * AuthLayout でラップして認証ページ専用の UI を提供する
 *
 * @param props - レイアウト用 props
 * @returns 認証レイアウトの JSX 要素
 */
export default function AuthGroupLayout({ children }: AuthGroupLayoutProps): React.JSX.Element {
  return <AuthLayout>{children}</AuthLayout>;
}
