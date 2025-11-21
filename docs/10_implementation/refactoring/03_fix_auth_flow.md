# WebSocket接続と認証連携の修正

## 実施日
2025-11-21

## 問題の概要

ログインは成功するが、その後のチャット機能が全く動作しない状況。具体的な問題点:

1. **WebSocket接続が確立されない**
2. **認証トークンがWebSocket接続時に伝播されていない**
3. **CORS設定とポート設定に不整合がある**

## 問題の原因分析

### 1. Backend ポート設定の問題

**問題箇所**: `backend/src/main.ts:23`
```typescript
await app.listen(process.env.PORT ?? 3000);  // ❌ 3000は間違い
```

**影響**:
- バックエンドが3000で起動してしまう
- フロントエンド（3000）と競合
- 本来は3001で起動すべき

### 2. CORS設定の問題

**問題箇所**: `backend/src/main.ts:19`
```typescript
origin: ['http://localhost:3001', 'http://localhost:3000']
```

**問題点**:
- `http://localhost:3001` はバックエンド自身のポート（不要）
- 正しくは `http://localhost:3000` のみ（フロントエンドのオリジン）

### 3. Frontend WebSocket実装が存在しない

**現状**:
- `socket.io-client` はpackage.jsonに含まれている
- しかし、実際の接続コード（useSocketフックなど）が未実装
- チャットルームページも未実装

## 修正方針

### Phase 1: Backend設定の修正

#### 1.1 ポート設定の修正
```typescript
// backend/src/main.ts
await app.listen(process.env.PORT ?? 3001);  // ✅ 3001に修正
```

#### 1.2 CORS設定の修正
```typescript
// backend/src/main.ts
app.enableCors({
  origin: ['http://localhost:3000', 'http://10.255.255.254:3000'],  // ✅ フロントエンドのみ
  credentials: true,
});
```

#### 1.3 WebSocket CORS設定の確認
```typescript
// backend/src/chat/chat.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',  // ✅ 既に正しい
    credentials: true,
  },
})
```

### Phase 2: Frontend WebSocket実装

#### 2.1 useSocketフックの作成

**ファイル**: `frontend/src/hooks/useSocket.ts`

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { useEnv } from '@/components/providers/EnvProvider';

export function useSocket() {
  const { socketUrl } = useEnv();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socketInstance = io(socketUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      autoConnect: true,
    });

    socketInstance.on('connect', () => setIsConnected(true));
    socketInstance.on('disconnect', () => setIsConnected(false));
    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(socketInstance);
    return () => socketInstance.disconnect();
  }, [socketUrl]);

  return { socket, isConnected };
}
```

**重要なポイント**:
1. `auth.token` にJWTトークンを含める
2. `Bearer` プレフィックスを付ける
3. トークンがない場合は接続しない
4. 接続状態を管理する

#### 2.2 チャットルームページの作成

**ファイル**: `frontend/src/app/room/[id]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

interface Message {
  id: number;
  content: string;
  user: {
    username: string;
  };
  createdAt: string;
}

export default function RoomPage() {
  const params = useParams();
  const roomId = Number(params.id);
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    if (!socket || !isConnected) return;

    // ルームに参加
    socket.emit('joinRoom', { roomId });

    // 新しいメッセージを受信
    socket.on('newMessage', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // クリーンアップ
    return () => {
      socket.emit('leaveRoom', { roomId });
      socket.off('newMessage');
    };
  }, [socket, isConnected, roomId]);

  const sendMessage = () => {
    if (!socket || !inputMessage.trim()) return;

    socket.emit('sendMessage', {
      roomId,
      content: inputMessage,
    });

    setInputMessage('');
  };

  if (!isConnected) {
    return <div>Connecting to chat...</div>;
  }

  return (
    <div>
      <h1>Room {roomId}</h1>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.user.username}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

### Phase 3: 認証フローの整備

#### 3.1 ログイン後のリダイレクト確認

**ファイル**: `frontend/src/components/auth/LoginForm.tsx`

```typescript
async function onSubmit(values: z.infer<typeof formSchema>) {
  try {
    const res = await api.post<LoginResponse>("/auth/login", values as LoginRequest);
    localStorage.setItem("accessToken", res.data.access_token);  // ✅ トークン保存
    toast.success("Login successful");
    router.push("/");  // ✅ ホームへリダイレクト
  } catch {
    toast.error("Login failed");
  }
}
```

#### 3.2 ホームページでの認証チェック

**ファイル**: `frontend/src/app/page.tsx`

```typescript
useEffect(() => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    router.push("/auth/login");  // ✅ トークンがなければログインへ
  } else {
    setTimeout(() => setIsAuthenticated(true), 0);  // ✅ 認証済み状態にする
  }
}, [router]);
```

## 実装チェックリスト

### Backend
- [x] Gateway に認証ロジックが実装されている（`chat.gateway.ts`）
- [x] WsJwtGuard が実装されている
- [ ] main.ts のポートを3001に修正
- [ ] main.ts の CORS origin を修正
- [x] WebSocketGateway の CORS 設定が正しい

### Frontend
- [ ] useSocket フックの実装
- [ ] チャットルームページの実装
- [ ] トークン管理の確認
- [x] LoginForm でトークン保存が実装されている
- [x] ホームページで認証チェックが実装されている

## トラブルシューティング

### 問題1: "Unauthorized" エラーが発生する

**原因**:
- トークンが正しく送信されていない
- トークン形式が間違っている

**解決方法**:
1. ブラウザの開発者ツールで WebSocket の接続リクエストを確認
2. `auth.token` に正しい値が含まれているか確認
3. Backend のログで認証エラーを確認

### 問題2: WebSocket 接続が確立されない

**原因**:
- CORS 設定が間違っている
- ポートが間違っている
- ネットワークの問題

**解決方法**:
1. Backend のポートが3001で起動しているか確認
2. Frontend から `http://localhost:3001` にアクセスできるか確認
3. CORS エラーがブラウザコンソールに表示されていないか確認

### 問題3: メッセージが送受信できない

**原因**:
- ルームに参加していない
- イベント名が間違っている
- データベース接続の問題

**解決方法**:
1. `joinRoom` イベントが正しく送信されているか確認
2. Backend のログでイベント受信を確認
3. データベースにメッセージが保存されているか確認

## まとめ

この修正により、以下が実現されます:

1. ✅ **正しいポート設定**: Backend は3001、Frontend は3000
2. ✅ **適切な CORS 設定**: フロントエンドのオリジンのみ許可
3. ✅ **WebSocket 認証連携**: JWT トークンが正しく伝播
4. ✅ **完全な認証フロー**: ログイン → トークン保存 → WebSocket接続
5. ✅ **リアルタイムチャット**: メッセージの送受信が可能

次のステップでは、UI/UXの改善とエラーハンドリングの強化を行います。
