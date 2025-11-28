/**
 * @fileoverview CurrentUser デコレータ
 * @description リクエストから認証済みユーザー情報を取得するデコレータ
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../strategies/jwt.strategy';

/**
 * CurrentUser パラメータデコレータ
 * @description コントローラーメソッドで認証済みユーザー情報を取得
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
