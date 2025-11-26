/**
 * メインページ用レイアウト（認証必須）
 */

'use client';

import { AuthGuard } from '@/features/auth';
import { MainLayout } from '@/components/layout/main-layout';

export default function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <MainLayout>{children}</MainLayout>
    </AuthGuard>
  );
}
