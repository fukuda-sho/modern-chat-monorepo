/**
 * @fileoverview JWT 認証ガード
 * @description JWT トークンによる認証を要求するガード
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 認証ガードクラス
 * @description エンドポイントに適用して JWT 認証を必須にする
 * @extends AuthGuard
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
