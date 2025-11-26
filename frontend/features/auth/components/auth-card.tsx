/**
 * 認証カードコンポーネント
 * ログイン/サインアップ画面の共通ラッパー
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthCard({ title, description, children }: AuthCardProps) {
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
