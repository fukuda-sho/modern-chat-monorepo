import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

/**
 * JWTトークンで認証されたユーザー情報を含むリクエストインターフェース
 */
interface RequestWithUser {
  /** JwtStrategyによって検証・付与されたユーザー情報 */
  user: { userId: number; username: string };
}

/**
 * ユーザー情報関連のAPIエンドポイントを提供するコントローラー
 *
 * すべてのエンドポイントはJWT認証が必要です。
 */
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * 現在のユーザー情報を取得するエンドポイント
   *
   * JWTトークンから抽出されたユーザー情報を返却します。
   * このエンドポイントは認証されたユーザーのみアクセス可能です。
   *
   * @param req JwtAuthGuardによって検証済みのリクエスト
   * @returns 現在のユーザーID とユーザー名
   * @throws UnauthorizedException JWTトークンが無効または期限切れの場合
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: RequestWithUser) {
    // req.user is populated by JwtStrategy
    return req.user;
  }
}
