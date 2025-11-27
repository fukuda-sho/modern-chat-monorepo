# メッセージ履歴取得 API

## 機能概要

| 項目 | 内容 |
|------|------|
| 機能名 | メッセージ履歴取得 API |
| 対象 | Backend（NestJS） |
| 目的 | ルームごとの過去メッセージをカーソルベースのページネーションで取得する REST API を提供する |
| 関連機能 | フロントエンドの履歴表示、無限スクロール |

---

## 背景と課題

### 現状の問題

- ルーム（チャンネル / DM）に入っても「過去の会話履歴」が表示されない
- Socket.IO 接続後に届いたメッセージのみ表示され、リロードすると何も見えない状態

### 目標

Slack のような UX を実現するため、以下を可能にする REST API を提供：

1. ルームを開いたときに直近のメッセージ履歴を取得
2. 上方向スクロールで古いメッセージを追加取得（無限スクロール対応）
3. カーソルベースのページネーションで効率的なデータ取得

---

## API 仕様

### エンドポイント

```
GET /chat/rooms/:roomId/messages
```

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| roomId | string (UUID) | Yes | チャットルームの ID |

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| limit | number | No | 50 | 取得件数（1〜100） |
| cursor | string | No | - | ページネーションカーソル（メッセージ ID） |
| direction | 'older' \| 'newer' | No | 'older' | カーソルからの取得方向 |

### リクエスト例

```bash
# 最新メッセージから50件取得
GET /chat/rooms/123e4567-e89b-12d3-a456-426614174000/messages

# 特定メッセージより古い30件を取得
GET /chat/rooms/123e4567-e89b-12d3-a456-426614174000/messages?cursor=msg-id-xxx&direction=older&limit=30

# 特定メッセージより新しいメッセージを取得（ギャップ埋め用）
GET /chat/rooms/123e4567-e89b-12d3-a456-426614174000/messages?cursor=msg-id-xxx&direction=newer&limit=50
```

### レスポンス

```typescript
interface MessageHistoryResponse {
  data: MessageDto[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    prevCursor: string | null;
  };
}

interface MessageDto {
  id: string;
  content: string;
  roomId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### レスポンス例

```json
{
  "data": [
    {
      "id": "msg-001",
      "content": "Hello, world!",
      "roomId": "room-123",
      "userId": "user-456",
      "user": {
        "id": "user-456",
        "name": "John Doe",
        "avatarUrl": "https://example.com/avatar.png"
      },
      "createdAt": "2025-11-27T10:30:00.000Z",
      "updatedAt": "2025-11-27T10:30:00.000Z"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "msg-000",
    "prevCursor": null
  }
}
```

### エラーレスポンス

| ステータス | 条件 | レスポンス例 |
|-----------|------|-------------|
| 400 | バリデーションエラー | `{ "message": "limit must be between 1 and 100", "error": "Bad Request" }` |
| 401 | 未認証 | `{ "message": "Unauthorized", "statusCode": 401 }` |
| 403 | ルームへのアクセス権なし | `{ "message": "You don't have access to this room", "error": "Forbidden" }` |
| 404 | ルームが存在しない | `{ "message": "Room not found", "error": "Not Found" }` |

---

## 実装詳細

### ディレクトリ構成

```
backend/src/chat/
├── chat.module.ts
├── chat.controller.ts      # ← エンドポイント追加
├── chat.service.ts         # ← メソッド追加
├── chat.gateway.ts
├── dto/
│   ├── get-messages.dto.ts # ← 新規作成
│   └── message.dto.ts      # ← 既存または新規
└── types/
    └── message-history.types.ts # ← 新規作成
```

### DTO 定義

#### `get-messages.dto.ts`

```typescript
import { IsOptional, IsInt, Min, Max, IsUUID, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetMessagesDto {
  @ApiPropertyOptional({
    description: '取得件数',
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'ページネーションカーソル（メッセージID）',
  })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'カーソルからの取得方向',
    enum: ['older', 'newer'],
    default: 'older',
  })
  @IsOptional()
  @IsIn(['older', 'newer'])
  direction?: 'older' | 'newer' = 'older';
}
```

#### `message.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class UserBriefDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  avatarUrl: string | null;
}

export class MessageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  roomId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: UserBriefDto })
  user: UserBriefDto;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class PaginationDto {
  @ApiProperty()
  hasMore: boolean;

  @ApiProperty({ nullable: true })
  nextCursor: string | null;

  @ApiProperty({ nullable: true })
  prevCursor: string | null;
}

export class MessageHistoryResponseDto {
  @ApiProperty({ type: [MessageDto] })
  data: MessageDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;
}
```

### Controller 実装

```typescript
// chat.controller.ts に追加

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageHistoryResponseDto } from './dto/message.dto';
import { ChatService } from './chat.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms/:roomId/messages')
  @ApiOperation({
    summary: 'ルームのメッセージ履歴を取得',
    description: 'カーソルベースのページネーションでメッセージ履歴を取得します',
  })
  @ApiResponse({
    status: 200,
    description: 'メッセージ履歴',
    type: MessageHistoryResponseDto,
  })
  @ApiResponse({ status: 401, description: '未認証' })
  @ApiResponse({ status: 403, description: 'アクセス権限なし' })
  @ApiResponse({ status: 404, description: 'ルームが見つかりません' })
  async getMessages(
    @Param('roomId') roomId: string,
    @Query() query: GetMessagesDto,
    @CurrentUser() user: User,
  ): Promise<MessageHistoryResponseDto> {
    return this.chatService.getMessageHistory(roomId, user.id, query);
  }
}
```

### Service 実装

```typescript
// chat.service.ts に追加

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageHistoryResponseDto, MessageDto } from './dto/message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ルームのメッセージ履歴を取得
   * @param roomId ルームID
   * @param userId リクエストユーザーID
   * @param options ページネーションオプション
   * @returns メッセージ履歴とページネーション情報
   */
  async getMessageHistory(
    roomId: string,
    userId: string,
    options: GetMessagesDto,
  ): Promise<MessageHistoryResponseDto> {
    const { limit = 50, cursor, direction = 'older' } = options;

    // ルームの存在確認とアクセス権チェック
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        members: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // パブリックルームでない場合、メンバーシップをチェック
    if (!room.isPublic && room.members.length === 0) {
      throw new ForbiddenException("You don't have access to this room");
    }

    // カーソルの基準となるメッセージを取得
    let cursorMessage = null;
    if (cursor) {
      cursorMessage = await this.prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true, id: true },
      });
    }

    // メッセージを取得（limit + 1 件取得して hasMore を判定）
    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
        ...(cursorMessage && {
          OR: [
            {
              createdAt:
                direction === 'older'
                  ? { lt: cursorMessage.createdAt }
                  : { gt: cursorMessage.createdAt },
            },
            {
              createdAt: cursorMessage.createdAt,
              id:
                direction === 'older'
                  ? { lt: cursorMessage.id }
                  : { gt: cursorMessage.id },
            },
          ],
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { createdAt: direction === 'older' ? 'desc' : 'asc' },
        { id: direction === 'older' ? 'desc' : 'asc' },
      ],
      take: limit + 1,
    });

    // hasMore の判定
    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    // direction が 'newer' の場合は古い順に並べ替え
    if (direction === 'newer') {
      resultMessages.reverse();
    }

    // レスポンス用に整形
    const data: MessageDto[] = resultMessages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      roomId: msg.roomId,
      userId: msg.userId,
      user: {
        id: msg.user.id,
        name: msg.user.name,
        avatarUrl: msg.user.avatarUrl,
      },
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
    }));

    // ページネーション情報
    const firstMsg = data[0];
    const lastMsg = data[data.length - 1];

    return {
      data,
      pagination: {
        hasMore,
        nextCursor: hasMore && lastMsg ? lastMsg.id : null,
        prevCursor: firstMsg ? firstMsg.id : null,
      },
    };
  }
}
```

---

## データベース考慮事項

### インデックス最適化

メッセージ履歴のクエリパフォーマンスを確保するため、以下のインデックスを推奨：

```prisma
// schema.prisma

model Message {
  id        String   @id @default(uuid())
  content   String   @db.Text
  roomId    String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  room ChatRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([roomId, createdAt(sort: Desc), id(sort: Desc)])
  @@index([roomId, createdAt, id])
}
```

### クエリ最適化のポイント

1. **複合インデックス**: `roomId + createdAt + id` の複合インデックスでカーソルベースのページネーションを効率化
2. **Descending Index**: 「古い順」取得が主なユースケースのため、降順インデックスを優先
3. **カバリングインデックス**: 必要に応じて、頻繁に取得するカラムをインデックスに含める

---

## 認証・認可

### 認証

- `JwtAuthGuard` による JWT トークン検証
- `@CurrentUser()` デコレータでリクエストユーザーを取得

### 認可

- **パブリックルーム**: 全認証ユーザーがアクセス可能
- **プライベートルーム**: `ChatRoomMember` にエントリがあるユーザーのみアクセス可能

---

## テスト方針

### 単体テスト（`chat.service.spec.ts`）

```typescript
describe('ChatService.getMessageHistory', () => {
  describe('正常系', () => {
    it('最新メッセージから指定件数を取得できること');
    it('カーソル指定で古いメッセージを取得できること');
    it('カーソル指定で新しいメッセージを取得できること');
    it('hasMore が正しく判定されること');
    it('メッセージが時系列順にソートされていること');
  });

  describe('異常系', () => {
    it('存在しないルームで404エラーを返すこと');
    it('アクセス権のないプライベートルームで403エラーを返すこと');
    it('無効なカーソルでも正常に動作すること');
  });

  describe('境界値', () => {
    it('メッセージが0件の場合、空配列を返すこと');
    it('limit=1 で正しく動作すること');
    it('limit=100 で正しく動作すること');
  });
});
```

### E2E テスト（`chat.e2e-spec.ts`）

```typescript
describe('GET /chat/rooms/:roomId/messages', () => {
  it('認証済みユーザーがメッセージ履歴を取得できること');
  it('未認証リクエストが401を返すこと');
  it('存在しないルームが404を返すこと');
  it('ページネーションが正しく動作すること');
});
```

---

## 実装ステップ

### Phase 1: 基盤整備

1. [ ] DTO ファイル作成（`get-messages.dto.ts`, `message.dto.ts`）
2. [ ] 型定義ファイル作成（必要に応じて）
3. [ ] Prisma スキーマのインデックス確認・追加

### Phase 2: ロジック実装

4. [ ] `ChatService.getMessageHistory` メソッド実装
5. [ ] `ChatController` にエンドポイント追加
6. [ ] Swagger デコレータ追加

### Phase 3: テスト

7. [ ] 単体テスト作成
8. [ ] E2E テスト作成
9. [ ] 手動テスト（Swagger UI / curl）

### Phase 4: 最適化（必要に応じて）

10. [ ] クエリパフォーマンス検証
11. [ ] インデックス調整
12. [ ] キャッシュ検討（将来的）

---

## 将来の拡張ポイント

1. **既読管理との連携**: `lastReadMessageId` を返却に含める
2. **検索機能**: メッセージ内容での全文検索
3. **リアクション**: メッセージへのリアクション情報を含める
4. **スレッド**: スレッド返信の取得
5. **添付ファイル**: ファイルメタデータの含有

---

## 参考資料

- [Slack API: conversations.history](https://api.slack.com/methods/conversations.history)
- [Cursor-based Pagination](https://slack.engineering/evolving-api-pagination-at-slack/)
- [Prisma Pagination](https://www.prisma.io/docs/concepts/components/prisma-client/pagination)
