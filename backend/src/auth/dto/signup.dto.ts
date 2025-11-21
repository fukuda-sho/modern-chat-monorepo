import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * ユーザー登録リクエストのデータ転送オブジェクト
 *
 * ユーザー新規登録時に必要な情報を検証します。
 */
export class SignupDto {
  /**
   * ユーザー名
   *
   * チャットルームで表示される名前です。
   * 2文字以上である必要があります。
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  username!: string;

  /**
   * メールアドレス
   *
   * ログイン時の識別子として使用されます。
   * システム内で一意である必要があります。
   * RFC 5322準拠のメールアドレス形式で入力してください。
   */
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /**
   * パスワード（平文）
   *
   * データベースに保存される前にbcryptでハッシュ化されます。
   * 6文字以上である必要があります。
   * セキュリティのため、英数字と記号を組み合わせることを推奨します。
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

