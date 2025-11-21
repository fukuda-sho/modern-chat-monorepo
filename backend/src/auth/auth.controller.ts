import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto, LoginResponseDto, UserResponseDto } from './dto';

/**
 * 認証関連のAPIエンドポイントを提供するコントローラー
 *
 * ユーザー登録とログイン機能を提供します。
 * 認証にはJWTトークンを使用し、パスワードはbcryptでハッシュ化されます。
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * ユーザー登録エンドポイント
   *
   * 新規ユーザーを作成し、ユーザー情報を返却します。
   * パスワードはbcryptでハッシュ化されてデータベースに保存されます。
   * 登録後、自動的にログインはされないため、別途ログインが必要です。
   *
   * @param signupDto ユーザー登録情報（メールアドレス、パスワード、表示名）
   * @returns 登録されたユーザー情報（パスワードは含まれません）
   * @throws ConflictException メールアドレスが既に使用されている場合
   * @throws BadRequestException バリデーションエラーが発生した場合
   */
  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<UserResponseDto> {
    return this.authService.signup(signupDto);
  }

  /**
   * ログインエンドポイント
   *
   * メールアドレスとパスワードで認証を行い、JWTトークンを返却します。
   * トークンの有効期限は24時間です。
   *
   * @param loginDto ログイン情報（メールアドレス、パスワード）
   * @returns ユーザー情報とJWTアクセストークン
   * @throws UnauthorizedException メールアドレスまたはパスワードが正しくない場合
   * @throws BadRequestException バリデーションエラーが発生した場合
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }
}
