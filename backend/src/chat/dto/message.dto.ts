/**
 * @fileoverview メッセージ関連 DTO
 * @description メッセージ履歴 API のレスポンス型定義
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * ユーザー簡易情報 DTO
 * @description メッセージに含まれるユーザー情報
 */
export class UserBriefDto {
  @ApiProperty({
    description: 'ユーザー ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ユーザー名',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'メールアドレス',
    example: 'john@example.com',
  })
  email: string;
}

/**
 * リアクション集計情報 DTO
 */
export class ReactionSummaryDto {
  @ApiProperty({
    description: '絵文字',
    example: '👍',
  })
  emoji: string;

  @ApiProperty({
    description: 'リアクション数',
    example: 3,
  })
  count: number;

  @ApiProperty({
    description: 'リアクションしたユーザー ID 一覧',
    example: [1, 2, 3],
  })
  userIds: number[];
}

/**
 * メッセージ DTO
 * @description API レスポンスのメッセージ形式
 */
export class MessageDto {
  @ApiProperty({
    description: 'メッセージ ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'メッセージ内容',
    example: 'Hello, world!',
  })
  content: string;

  @ApiProperty({
    description: '親メッセージ ID（スレッド返信の場合）',
    example: null,
    nullable: true,
  })
  parentMessageId: number | null;

  @ApiProperty({
    description: 'ルーム ID',
    example: 1,
  })
  roomId: number;

  @ApiProperty({
    description: '送信者ユーザー ID',
    example: 1,
  })
  userId: number;

  @ApiProperty({
    description: '送信者ユーザー情報',
    type: UserBriefDto,
  })
  user: UserBriefDto;

  @ApiProperty({
    description: '作成日時（ISO 8601 形式）',
    example: '2025-11-27T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: '編集済みかどうか',
    example: false,
  })
  isEdited: boolean;

  @ApiProperty({
    description: '編集日時（ISO 8601 形式）',
    example: '2025-11-27T11:00:00.000Z',
    nullable: true,
  })
  editedAt: string | null;

  @ApiProperty({
    description: '削除済みかどうか',
    example: false,
  })
  isDeleted: boolean;

  @ApiProperty({
    description: 'スレッド返信数',
    example: 3,
  })
  threadReplyCount: number;

  @ApiProperty({
    description: '最後の返信日時（ISO 8601 形式）',
    example: '2025-11-27T11:00:00.000Z',
    nullable: true,
  })
  threadLastRepliedAt: string | null;

  @ApiProperty({
    description: '最後に返信したユーザー ID',
    example: 2,
    nullable: true,
  })
  threadLastRepliedBy: number | null;

  @ApiProperty({
    description: '最後に返信したユーザー情報',
    type: UserBriefDto,
    nullable: true,
  })
  threadLastRepliedByUser?: UserBriefDto | null;

  @ApiProperty({
    description: 'リアクション一覧',
    type: [ReactionSummaryDto],
  })
  reactions: ReactionSummaryDto[];
}

/**
 * ページネーション情報 DTO
 * @description カーソルベースのページネーション情報
 */
export class PaginationDto {
  @ApiProperty({
    description: 'さらにデータがあるかどうか',
    example: true,
  })
  hasMore: boolean;

  @ApiProperty({
    description: '次ページのカーソル（古い方向）',
    nullable: true,
    example: 99,
  })
  nextCursor: number | null;

  @ApiProperty({
    description: '前ページのカーソル（新しい方向）',
    nullable: true,
    example: 150,
  })
  prevCursor: number | null;
}

/**
 * メッセージ履歴レスポンス DTO
 * @description メッセージ履歴 API のレスポンス形式
 */
export class MessageHistoryResponseDto {
  @ApiProperty({
    description: 'メッセージ一覧',
    type: [MessageDto],
  })
  data: MessageDto[];

  @ApiProperty({
    description: 'ページネーション情報',
    type: PaginationDto,
  })
  pagination: PaginationDto;
}
