/**
 * @fileoverview サインアップ用 DTO
 * @description ユーザー登録リクエストのバリデーションを定義
 */

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
  @IsString()
  @IsNotEmpty()
  username: string;

  /**
   * メールアドレス
   * @description 有効なメールアドレス形式である必要がある
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * パスワード
   * @description 最低8文字以上である必要がある
   */
  @IsString()
  @MinLength(8)
  password: string;
}
