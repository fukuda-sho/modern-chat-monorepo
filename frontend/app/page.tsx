/**
 * ランディングページ
 * 認証状態に応じてリダイレクト
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  // ランディングページは一旦チャットページにリダイレクト
  // 将来的には認証状態に応じた処理を追加
  redirect('/chat');
}
