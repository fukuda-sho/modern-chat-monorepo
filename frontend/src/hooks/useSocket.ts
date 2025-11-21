import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { useEnv } from '@/components/providers/EnvProvider';

/**
 * WebSocket接続とリアルタイム通信を管理するカスタムフック
 *
 * Socket.IOを使用してサーバーとのリアルタイム双方向通信を確立します。
 * ローカルストレージに保存されたJWTトークンを使用して認証を行います。
 *
 * ## 機能
 * - 自動的なWebSocket接続の確立と切断
 * - JWT認証によるセキュアな接続
 * - 接続状態の管理とエラーハンドリング
 * - コンポーネントのアンマウント時の自動クリーンアップ
 *
 * ## 使用例
 * ```tsx
 * function ChatRoom() {
 *   const { socket, isConnected } = useSocket();
 *
 *   useEffect(() => {
 *     if (!socket || !isConnected) return;
 *
 *     socket.emit('joinRoom', { roomId: 1 });
 *     socket.on('newMessage', (message) => {
 *       console.log('New message:', message);
 *     });
 *
 *     return () => {
 *       socket.off('newMessage');
 *     };
 *   }, [socket, isConnected]);
 *
 *   return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>;
 * }
 * ```
 *
 * @returns Socket.IOインスタンスと接続状態
 */
export function useSocket() {
  const { socketUrl } = useEnv();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // トークンを取得
    const token = localStorage.getItem('accessToken');

    if (!token) {
      // トークンがない場合は接続しない
      console.log('No token found, skipping socket connection');
      return;
    }

    console.log('Initializing socket connection to:', socketUrl);

    // Socket.IOクライアントの初期化
    const socketInstance = io(socketUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      autoConnect: true,
      transports: ['websocket', 'polling'], // WebSocketを優先
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(socketInstance);

    // クリーンアップ
    return () => {
      console.log('Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [socketUrl]);

  return { socket, isConnected };
}
