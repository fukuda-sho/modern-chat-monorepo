/**
 * @fileoverview サインアップ用 DTO
 * @description ユーザー登録リクエストのバリデーションを定義
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * サインアップ用データ転送オブジェクト
 * @description ユーザー登録時に必要なフィールドを定義
 */
export class SignupDto {
  /**
   * ユーザー名
   * @description 空文字は許可されない
   */
  @ApiProperty({
    example: 'johndoe',
    description: 'ユーザー名（一意である必要があります）',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  /**
   * メールアドレス
   * @description 有効なメールアドレス形式である必要がある
   */
  @ApiProperty({
    example: 'user@example.com',
    description: 'メールアドレス（一意である必要があります）',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * パスワード
   * @description 最低8文字以上である必要がある
   */
  @ApiProperty({
    example: 'password123',
    description: 'パスワード（8文字以上）',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}
