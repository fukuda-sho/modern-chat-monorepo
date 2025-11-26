/**
 * 認証ページ用レイアウト
 */

import { AuthLayout } from '@/components/layout/auth-layout';

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
