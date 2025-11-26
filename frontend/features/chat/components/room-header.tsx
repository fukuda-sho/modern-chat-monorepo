/**
 * ルームヘッダーコンポーネント
 */

'use client';

import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '../store/chat-store';

interface RoomHeaderProps {
  roomId: number;
  roomName?: string;
}

export function RoomHeader({ roomId, roomName }: RoomHeaderProps) {
  const connectionStatus = useChatStore((state) => state.connectionStatus);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  return (
    <header className="bg-background flex items-center gap-3 border-b px-4 py-3">
      <Button variant="ghost" size="icon" asChild className="md:hidden">
        <Link href="/chat">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">戻る</span>
        </Link>
      </Button>

      <div className="flex flex-1 items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
        <h1 className="font-semibold">{roomName || `Room ${roomId}`}</h1>
      </div>

      <Badge variant="secondary" className="gap-1">
        <Users className="h-3 w-3" />
        <span>--</span>
      </Badge>
    </header>
  );
}
