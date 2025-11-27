/**
 * @fileoverview チャットルーム作成 DTO
 * @description POST /chat-rooms リクエストのバリデーション用 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, MinLength, Matches } from 'class-validator';

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
}
