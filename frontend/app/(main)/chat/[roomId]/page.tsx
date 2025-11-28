/**
 * @fileoverview 個別チャットルームページ
 * @description 特定のチャットルームを表示するページ（Server Component）
 * URL パラメータの roomId を検証し、ChatRoom コンポーネントに渡す
 */

import { ChatRoom } from '@/features/chat';

/** チャットルームページの Props 型 */
type ChatRoomPageProps = {
  /** Next.js 動的ルートパラメータ（Promise 形式） */
  params: Promise<{
    /** ルーム ID（URL パスから取得） */
    roomId: string;
  }>;
};

/**
 * 個別チャットルームページコンポーネント（Server Component）
 * URL の roomId パラメータを数値として検証し、ChatRoom コンポーネントに渡す
 * ルームの存在確認は ChatRoom コンポーネント側で API を通じて行う
 *
 * @param props - ページ props（動的ルートパラメータを含む）
 * @returns チャットルームページの JSX 要素
 */
export default async function ChatRoomPage({ params }: ChatRoomPageProps): Promise<React.JSX.Element> {
  const { roomId } = await params;
  const roomIdNum = Number(roomId);

  // 無効な数値の場合
  if (isNaN(roomIdNum) || roomIdNum <= 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">無効なルームIDです</p>
      </div>
    );
  }

  return <ChatRoom roomId={roomIdNum} />;
}
