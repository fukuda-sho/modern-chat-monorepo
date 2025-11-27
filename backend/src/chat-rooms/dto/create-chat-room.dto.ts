/**
 * @fileoverview チャットルーム作成 DTO
 * @description POST /chat-rooms リクエストのバリデーション用 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ChannelType } from '@prisma/client';

/**
 * チャットルーム作成リクエスト DTO
 * @description 新規チャットルーム作成時のリクエストボディ定義
 */
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

  @ApiPropertyOptional({
    description: 'チャンネルの説明',
    example: 'General discussion channel',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '説明は500文字以内で入力してください' })
  description?: string;

  @ApiPropertyOptional({
    description: 'チャンネルタイプ',
    enum: ChannelType,
    example: ChannelType.PUBLIC,
    default: ChannelType.PUBLIC,
  })
  @IsOptional()
  @IsEnum(ChannelType, { message: '無効なチャンネルタイプです' })
  type?: ChannelType;
}
