/**
 * @fileoverview ログイン用 DTO
 * @description ログインリクエストのバリデーションを定義
 */

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
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * パスワード
   * @description 空文字は許可されない
   */
  @IsString()
  @IsNotEmpty()
  password: string;
}
