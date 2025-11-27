/**
 * @fileoverview 認証カードコンポーネント
 * @description ログイン/サインアップ画面の共通ラッパー
 * アプリロゴ、タイトル、説明文を含むカード形式の UI を提供
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

/** 認証カードの Props 型 */
type AuthCardProps = {
  /** カードのタイトル（例: "Chat App"） */
  title: string;
  /** カードの説明文（例: "アカウントにログイン"） */
  description: string;
  /** カード内に表示するコンテンツ（フォームなど） */
  children: React.ReactNode;
};

/**
 * 認証カードコンポーネント
 * ログイン・サインアップページで共通して使用するカード UI
 * アプリアイコン、タイトル、説明文、子コンテンツを表示
 *
 * @param props - 認証カード用 props
 * @returns 認証カードの JSX 要素
 */
export function AuthCard({ title, description, children }: AuthCardProps): React.JSX.Element {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-4 text-center">
        <div className="bg-primary mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <MessageCircle className="text-primary-foreground h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
