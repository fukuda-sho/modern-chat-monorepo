/**
 * @fileoverview 認証レイアウトコンポーネント
 * @description ログイン・サインアップページ用のレイアウト
 * グラデーション背景で中央配置のコンテナを提供
 */

/** 認証レイアウトの Props 型 */
type AuthLayoutProps = {
  /** 認証フォームなどの子コンテンツ */
  children: React.ReactNode;
};

/**
 * 認証レイアウトコンポーネント
 * サーバーコンポーネントとして以下の機能を提供:
 * - グラデーション背景の全画面レイアウト
 * - 子コンテンツを中央に配置
 * - パディング付きでモバイル対応
 *
 * @param props - 認証レイアウト用 props
 * @returns 認証レイアウトの JSX 要素
 */
export function AuthLayout({ children }: AuthLayoutProps): React.JSX.Element {
  return (
    <div className="from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-br p-4">
      {children}
    </div>
  );
}
