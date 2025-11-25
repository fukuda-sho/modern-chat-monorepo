/**
 * @fileoverview ログイン用 DTO
 * @description ログインリクエストのバリデーションを定義
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * ログイン用データ転送オブジェクト
 * @description ログイン時に必要なフィールドを定義
 */
export class LoginDto {
  /**
   * メールアドレス
   * @description 有効なメールアドレス形式である必要がある
   */
  @ApiProperty({
    example: 'user@example.com',
    description: '登録済みのメールアドレス',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * パスワード
   * @description 空文字は許可されない
   */
  @ApiProperty({
    example: 'password123',
    description: 'パスワード',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
