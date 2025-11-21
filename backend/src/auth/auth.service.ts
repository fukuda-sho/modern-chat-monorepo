import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto, SignupDto, LoginResponseDto, UserResponseDto } from './dto';

/**
 * 認証機能を提供するサービス
 *
 * ユーザーの登録、ログイン、パスワード検証を担当します。
 * パスワードはbcryptでハッシュ化され、JWTトークンで認証を行います。
 */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * ユーザーの認証情報を検証します
   *
   * メールアドレスとパスワードの組み合わせが正しいか確認します。
   * パスワードはbcryptで比較され、認証に成功した場合はパスワードフィールドを除いた
   * ユーザー情報を返します。
   *
   * @param email ユーザーのメールアドレス
   * @param pass 検証する平文パスワード
   * @returns 認証成功時はユーザー情報（パスワード除く）、失敗時はnull
   */
  async validateUser(email: string, pass: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findOne({ email });
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * ユーザーのログイン処理を実行します
   *
   * メールアドレスとパスワードで認証を行い、成功した場合はJWTトークンを発行します。
   * トークンにはユーザー名とユーザーIDが含まれ、有効期限は設定ファイルで定義されます（デフォルト: 24時間）。
   *
   * @param loginDto ログイン情報（メールアドレスとパスワード）
   * @returns JWTアクセストークン
   * @throws UnauthorizedException メールアドレスまたはパスワードが正しくない場合
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * 新規ユーザーを登録します
   *
   * パスワードは自動的にbcryptでハッシュ化されます。
   * メールアドレスの重複チェックはUsersServiceで行われます。
   * 登録後、パスワードフィールドは除外されたユーザー情報を返します。
   *
   * @param signupDto ユーザー登録情報（メールアドレス、パスワード、表示名）
   * @returns 登録されたユーザー情報（パスワード除く）
   * @throws ConflictException メールアドレスが既に使用されている場合
   */
  async signup(signupDto: SignupDto): Promise<UserResponseDto> {
    const user = await this.usersService.create(signupDto);
    const { password: _password, ...result } = user;
    return result;
  }
}
