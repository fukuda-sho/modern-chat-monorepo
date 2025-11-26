/**
 * 接続状態表示コンポーネント
 */

'use client';

import { useChatStore } from '../store/chat-store';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function ConnectionStatus() {
  const status = useChatStore((state) => state.connectionStatus);

  const statusConfig = {
    connected: {
      label: '接続中',
      icon: Wifi,
      variant: 'default' as const,
    },
    connecting: {
      label: '接続中...',
      icon: Loader2,
      variant: 'secondary' as const,
    },
    disconnected: {
      label: '切断',
      icon: WifiOff,
      variant: 'destructive' as const,
    },
    error: {
      label: 'エラー',
      icon: WifiOff,
      variant: 'destructive' as const,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon
        className={`h-3 w-3 ${status === 'connecting' ? 'animate-spin' : ''}`}
      />
      {config.label}
    </Badge>
  );
}
