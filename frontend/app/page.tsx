/**
 * @fileoverview ランディングページ
 * @description アプリケーションのルートページ。認証状態に応じてリダイレクトを行う
 */

import { redirect } from 'next/navigation';

/**
 * ランディングページコンポーネント
 * 現在は /chat へ即座にリダイレクトする
 * 将来的には認証状態に応じた出し分けを実装予定
 *
 * @returns リダイレクト処理のため実際には何も返さない
 */
export default function HomePage(): never {
  // ランディングページは一旦チャットページにリダイレクト
  // 将来的には認証状態に応じた処理を追加
  redirect('/chat');
}
