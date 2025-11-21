import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * ログインリクエストのデータ転送オブジェクト
 *
 * ユーザー認証に必要な情報を検証します。
 */
export class LoginDto {
  /**
   * メールアドレス
   *
   * ログイン時の識別子です。
   * 登録時に使用したメールアドレスを入力してください。
   */
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /**
   * パスワード
   *
   * 登録時に設定したパスワードを入力してください。
   * 6文字以上である必要があります。
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

