/**
 * @fileoverview アプリケーションのエントリポイント
 * @description NestJS アプリケーションを起動し、グローバル設定を適用する
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * アプリケーションのブートストラップ関数
 * @description NestJS アプリケーションを初期化し、サーバーを起動する
 * @returns {Promise<void>} 起動完了時に解決される Promise
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // グローバルバリデーションパイプを設定
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS を有効化
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
