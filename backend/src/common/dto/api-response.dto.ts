/**
 * @fileoverview 共通 API レスポンス DTO
 * @description Swagger ドキュメント用のエラーレスポンス型定義
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * バリデーションエラーレスポンス DTO
 * @description 400 Bad Request 時のレスポンス形式
 */
export class ApiErrorResponseDto {
  @ApiProperty({
    example: 400,
    description: 'HTTP ステータスコード',
  })
  statusCode: number;

  @ApiProperty({
    example: ['email must be an email', 'password must be longer than or equal to 8 characters'],
    description: 'エラーメッセージ（単一または配列）',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'エラー種別',
  })
  error: string;
}

/**
 * 認証エラーレスポンス DTO
 * @description 401 Unauthorized 時のレスポンス形式
 */
export class UnauthorizedResponseDto {
  @ApiProperty({
    example: 401,
    description: 'HTTP ステータスコード',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Unauthorized',
    description: 'エラーメッセージ',
  })
  message: string;
}

/**
 * リソース未検出エラーレスポンス DTO
 * @description 404 Not Found 時のレスポンス形式
 */
export class NotFoundResponseDto {
  @ApiProperty({
    example: 404,
    description: 'HTTP ステータスコード',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Resource not found',
    description: 'エラーメッセージ',
  })
  message: string;

  @ApiProperty({
    example: 'Not Found',
    description: 'エラー種別',
  })
  error: string;
}

/**
 * 権限エラーレスポンス DTO
 * @description 403 Forbidden 時のレスポンス形式
 */
export class ForbiddenResponseDto {
  @ApiProperty({
    example: 403,
    description: 'HTTP ステータスコード',
  })
  statusCode: number;

  @ApiProperty({
    example: 'You do not have permission to perform this action',
    description: 'エラーメッセージ',
  })
  message: string;

  @ApiProperty({
    example: 'Forbidden',
    description: 'エラー種別',
  })
  error: string;
}

/**
 * 競合エラーレスポンス DTO
 * @description 409 Conflict 時のレスポンス形式
 */
export class ConflictResponseDto {
  @ApiProperty({
    example: 409,
    description: 'HTTP ステータスコード',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Email already exists',
    description: 'エラーメッセージ',
  })
  message: string;

  @ApiProperty({
    example: 'Conflict',
    description: 'エラー種別',
  })
  error: string;
}

/**
 * サービス利用不可エラーレスポンス DTO
 * @description 503 Service Unavailable 時のレスポンス形式
 */
export class ServiceUnavailableResponseDto {
  @ApiProperty({
    example: 503,
    description: 'HTTP ステータスコード',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Service temporarily unavailable',
    description: 'エラーメッセージ',
  })
  message: string;

  @ApiProperty({
    example: 'Service Unavailable',
    description: 'エラー種別',
  })
  error: string;
}
