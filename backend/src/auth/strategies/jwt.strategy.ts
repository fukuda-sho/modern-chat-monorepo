/**
 * @fileoverview JWT 認証戦略
 * @description Passport の JWT 戦略を実装し、トークン検証を行う
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * JWT ペイロードの型定義
 * @description JWT トークンに含まれるデータ構造
 */
export interface JwtPayload {
  /** ユーザー ID（subject） */
  sub: number;
  /** ユーザーのメールアドレス */
  email: string;
}

/**
 * 認証済みユーザー情報の型定義
 * @description request.user に設定されるユーザー情報
 */
export interface AuthenticatedUser {
  /** ユーザー ID */
  id: number;
  /** メールアドレス */
  email: string;
  /** ユーザー名 */
  username: string;
}

/**
 * JWT 認証戦略クラス
 * @description Authorization ヘッダから JWT を抽出し、検証を行う
 * @extends PassportStrategy
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * JwtStrategy のコンストラクタ
   * @param {PrismaService} prisma - Prisma サービスインスタンス
   */
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default-secret',
    });
  }

  /**
   * JWT ペイロードを検証し、ユーザー情報を返す
   * @param {JwtPayload} payload - JWT から抽出されたペイロード
   * @returns {Promise<AuthenticatedUser>} 認証済みユーザー情報
   * @throws {UnauthorizedException} ユーザーが存在しない場合
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return { id: user.id, email: user.email, username: user.username };
  }
}
