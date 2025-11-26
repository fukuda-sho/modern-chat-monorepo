/**
 * 認証レイアウトコンポーネント
 */

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      {children}
    </div>
  );
}
