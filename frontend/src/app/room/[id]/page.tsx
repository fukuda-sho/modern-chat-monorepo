'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { MessageResponse } from '@/types/api';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = Number(params.id);
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [roomName, setRoomName] = useState(`Room ${roomId}`);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 認証チェック
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  // WebSocketイベントのセットアップ
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('Socket not ready, waiting...');
      return;
    }

    console.log('Setting up socket events for room:', roomId);

    // ルームに参加
    socket.emit('joinRoom', { roomId });

    // ルームに参加成功
    socket.on('joinedRoom', (data: { roomId: number }) => {
      console.log('Joined room:', data.roomId);
    });

    // 新しいメッセージを受信
    socket.on('newMessage', (message: MessageResponse) => {
      console.log('Received new message:', message);
      setMessages((prev) => [...prev, message]);
    });

    // エラーハンドリング
    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      alert(`Error: ${error.message}`);
    });

    // クリーンアップ
    return () => {
      console.log('Leaving room:', roomId);
      socket.emit('leaveRoom', { roomId });
      socket.off('joinedRoom');
      socket.off('newMessage');
      socket.off('error');
    };
  }, [socket, isConnected, roomId]);

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !isConnected || !inputMessage.trim()) {
      console.log('Cannot send message:', { socket: !!socket, isConnected, inputMessage });
      return;
    }

    console.log('Sending message:', { roomId, content: inputMessage });

    socket.emit('sendMessage', {
      roomId,
      content: inputMessage,
    });

    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goBack = () => {
    router.push('/');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 m-4 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>{roomName}</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm text-gray-600">
                    {isConnected ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={goBack}>
                  Back
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-blue-600">
                          {msg.user.username}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-gray-800 mt-1">{msg.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isConnected
                      ? 'Type a message...'
                      : 'Connecting to chat...'
                  }
                  disabled={!isConnected}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!isConnected || !inputMessage.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
