# 09. Backend チャットルーム作成機能 設計書

## 0. ファイル情報

- パス: `docs/10_implementation/backend/09_backend-room-creation-feature.md`
- 対象: バックエンドアプリケーション（`backend/` ディレクトリ配下）
- 目的: ユーザーが REST API 経由でチャットルームを作成できる機能を実装する

---

## 1. 目的・スコープ

### 1.1 目的

- ユーザーが新規チャットルームを作成できる API エンドポイントを提供する
- 作成されたルームを DB に永続化し、誰が作成したかを追跡可能にする
- ルーム一覧を取得できる API エンドポイントを提供する

### 1.2 スコープ

- **含まれるもの**
  - Prisma スキーマの更新（`ChatRoom` に `createdByUserId` カラム追加）
  - `chat-rooms` モジュールの新規作成（Controller, Service, DTO）
  - JWT 認証付き REST API エンドポイント
  - 単体テスト（Service, Controller）

- **含まれないもの**
  - ルームの更新・削除機能（将来の拡張として別途実装）
  - WebSocket でのルーム作成通知（別途検討）

---

## 2. データベーススキーマ

### 2.1 ChatRoom モデル更新

`prisma/schema.prisma`:

```prisma
model ChatRoom {
  id              Int       @id @default(autoincrement())
  name            String    @unique @db.VarChar(255)
  createdByUserId Int?      @map("created_by_user_id")
  createdAt       DateTime  @default(now()) @map("created_at")
  messages        Message[]

  createdByUser User? @relation("CreatedRooms", fields: [createdByUserId], references: [id], onDelete: SetNull, onUpdate: Cascade)

  @@index([createdByUserId], map: "idx_chat_rooms_created_by")
  @@map("chat_rooms")
}
```

### 2.2 User モデル更新

```prisma
model User {
  id           Int        @id @default(autoincrement())
  username     String     @unique @db.VarChar(255)
  email        String     @unique @db.VarChar(255)
  password     String     @db.VarChar(255)
  createdAt    DateTime   @default(now()) @map("created_at")
  messages     Message[]
  createdRooms ChatRoom[] @relation("CreatedRooms")

  @@map("users")
}
```

### 2.3 マイグレーション

マイグレーションは `20251126235857_init` に統合済み：

```sql
-- CreateTable
CREATE TABLE `chat_rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `created_by_user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `chat_rooms_name_key`(`name`),
    INDEX `idx_chat_rooms_created_by`(`created_by_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chat_rooms` ADD CONSTRAINT `chat_rooms_created_by_user_id_fkey`
  FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
```

---

## 3. API エンドポイント

### 3.1 エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| `POST` | `/chat-rooms` | チャットルーム作成 | 必須 |
| `GET` | `/chat-rooms` | チャットルーム一覧取得 | 必須 |

### 3.2 POST /chat-rooms

#### リクエスト

```json
{
  "name": "general"
}
```

| フィールド | 型 | 必須 | バリデーション |
|------------|-----|------|----------------|
| `name` | string | Yes | 1-50文字、英数字・ハイフン・アンダースコアのみ |

#### レスポンス（201 Created）

```json
{
  "id": 1,
  "name": "general",
  "createdByUserId": 1,
  "createdAt": "2025-11-27T00:00:00.000Z"
}
```

#### エラーレスポンス

| ステータス | 説明 |
|------------|------|
| 400 | バリデーションエラー |
| 401 | 未認証 |
| 409 | ルーム名の重複 |

### 3.3 GET /chat-rooms

#### レスポンス（200 OK）

```json
[
  {
    "id": 1,
    "name": "general",
    "createdByUserId": 1,
    "createdAt": "2025-11-27T00:00:00.000Z"
  },
  {
    "id": 2,
    "name": "random",
    "createdByUserId": 2,
    "createdAt": "2025-11-27T00:01:00.000Z"
  }
]
```

---

## 4. ディレクトリ構成

```
backend/src/chat-rooms/
├── dto/
│   ├── create-chat-room.dto.ts   # 作成リクエスト DTO
│   └── index.ts                   # DTO エクスポート
├── chat-rooms.controller.ts       # REST API コントローラー
├── chat-rooms.controller.spec.ts  # コントローラーテスト
├── chat-rooms.service.ts          # ビジネスロジック
├── chat-rooms.service.spec.ts     # サービステスト
└── chat-rooms.module.ts           # モジュール定義
```

---

## 5. 実装詳細

### 5.1 DTO

`src/chat-rooms/dto/create-chat-room.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateChatRoomDto {
  @ApiProperty({
    description: 'チャットルーム名',
    example: 'general',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'ルーム名は必須です' })
  @MinLength(1, { message: 'ルーム名は1文字以上で入力してください' })
  @MaxLength(50, { message: 'ルーム名は50文字以内で入力してください' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'ルーム名は英数字、ハイフン、アンダースコアのみ使用可能です',
  })
  name: string;
}
```

### 5.2 Service

`src/chat-rooms/chat-rooms.service.ts`:

```typescript
@Injectable()
export class ChatRoomsService {
  constructor(private prisma: PrismaService) {}

  async create(createChatRoomDto: CreateChatRoomDto, userId: number): Promise<ChatRoom> {
    // ルーム名の重複チェック
    const existingRoom = await this.prisma.chatRoom.findUnique({
      where: { name: createChatRoomDto.name },
    });

    if (existingRoom) {
      throw new ConflictException('このルーム名は既に使用されています');
    }

    return this.prisma.chatRoom.create({
      data: {
        name: createChatRoomDto.name,
        createdByUserId: userId,
      },
    });
  }

  async findAll(): Promise<ChatRoom[]> {
    return this.prisma.chatRoom.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: number): Promise<ChatRoom | null> {
    return this.prisma.chatRoom.findUnique({
      where: { id },
    });
  }
}
```

### 5.3 Controller

`src/chat-rooms/chat-rooms.controller.ts`:

```typescript
@ApiTags('chat-rooms')
@ApiBearerAuth('access-token')
@Controller('chat-rooms')
@UseGuards(JwtAuthGuard)
export class ChatRoomsController {
  constructor(private chatRoomsService: ChatRoomsService) {}

  @Post()
  @ApiOperation({ summary: 'チャットルーム作成' })
  async create(
    @Request() req: RequestWithUser,
    @Body() createChatRoomDto: CreateChatRoomDto,
  ): Promise<object> {
    return this.chatRoomsService.create(createChatRoomDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'チャットルーム一覧取得' })
  async findAll(): Promise<object[]> {
    return this.chatRoomsService.findAll();
  }
}
```

### 5.4 Module

`src/chat-rooms/chat-rooms.module.ts`:

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [ChatRoomsController],
  providers: [ChatRoomsService],
  exports: [ChatRoomsService],
})
export class ChatRoomsModule {}
```

---

## 6. テスト

### 6.1 テストファイル

| ファイル | テスト数 | カバー範囲 |
|----------|----------|------------|
| `chat-rooms.service.spec.ts` | 6 | create, findAll, findById |
| `chat-rooms.controller.spec.ts` | 3 | create, findAll |

### 6.2 テスト実行

```bash
# chat-rooms モジュールのテスト
yarn test --testPathPatterns="chat-rooms"

# 全テスト実行
yarn test

# Docker 環境
docker compose exec backend yarn test
```

### 6.3 テスト結果

```
PASS src/chat-rooms/chat-rooms.service.spec.ts
PASS src/chat-rooms/chat-rooms.controller.spec.ts

Test Suites: 2 passed, 2 total
Tests:       9 passed, 9 total
```

---

## 7. Swagger ドキュメント

Swagger UI で API ドキュメントを確認可能：

- URL: `http://localhost:3000/api/docs`
- タグ: `chat-rooms`

---

## 8. 動作確認手順

### 8.1 ユーザー登録・ログイン

```bash
# ユーザー登録
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "username": "testuser"}'

# ログイン（トークン取得）
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 8.2 ルーム作成

```bash
curl -X POST http://localhost:3000/chat-rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"name": "general"}'
```

### 8.3 ルーム一覧取得

```bash
curl -X GET http://localhost:3000/chat-rooms \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## 9. 変更ファイル一覧

| ファイル | 変更種別 | 説明 |
|----------|----------|------|
| `prisma/schema.prisma` | 修正 | ChatRoom に createdByUserId 追加、name に unique 制約 |
| `prisma/migrations/20251126235857_init/migration.sql` | 修正 | マイグレーション統合 |
| `src/chat-rooms/dto/create-chat-room.dto.ts` | 新規 | 作成リクエスト DTO |
| `src/chat-rooms/dto/index.ts` | 新規 | DTO エクスポート |
| `src/chat-rooms/chat-rooms.service.ts` | 新規 | CRUD サービス |
| `src/chat-rooms/chat-rooms.service.spec.ts` | 新規 | サービステスト |
| `src/chat-rooms/chat-rooms.controller.ts` | 新規 | REST API コントローラー |
| `src/chat-rooms/chat-rooms.controller.spec.ts` | 新規 | コントローラーテスト |
| `src/chat-rooms/chat-rooms.module.ts` | 新規 | モジュール定義 |
| `src/app.module.ts` | 修正 | ChatRoomsModule 追加 |

---

## 10. 完了条件

- [x] Prisma スキーマに `createdByUserId` カラムが追加されている
- [x] `name` カラムにユニーク制約が設定されている
- [x] `POST /chat-rooms` でルーム作成ができる
- [x] `GET /chat-rooms` でルーム一覧取得ができる
- [x] 重複するルーム名で 409 エラーが返る
- [x] 未認証で 401 エラーが返る
- [x] `yarn test` が成功する（9テスト追加）
- [x] Swagger ドキュメントに反映されている
