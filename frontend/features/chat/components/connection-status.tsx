/**
 * @fileoverview 接続状態表示コンポーネント
 * @description WebSocket の接続状態をバッジで視覚的に表示する
 * connected/connecting/disconnected/error の 4 状態に対応
 */

'use client';

import { useChatStore } from '../store/chat-store';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

/**
 * 接続状態表示コンポーネント
 * クライアントコンポーネントとして Zustand ストアから接続状態を取得
 * 状態に応じたアイコン・ラベル・色を持つバッジを表示
 *
 * @returns 接続状態バッジの JSX 要素
 */
export function ConnectionStatus(): React.JSX.Element {
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
