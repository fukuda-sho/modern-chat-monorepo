/**
 * @fileoverview チャットルーム一覧ページ（ルーム未選択時）
 * @description サイドバーでルームが選択されていない状態で表示されるページ
 */

import { EmptyRoom } from '@/features/chat';

/**
 * チャットページコンポーネント（ルーム未選択時）
 * ルームが選択されていない場合に、ルーム選択を促すメッセージを表示する
 *
 * @returns チャットページの JSX 要素
 */
export default function ChatPage(): React.JSX.Element {
  return <EmptyRoom />;
}
