import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

/**
 * アプリケーションのブートストラップ処理
 *
 * NestJSアプリケーションを初期化し、グローバル設定を適用します。
 * 環境変数はConfigServiceを通じて取得されます。
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ConfigServiceを取得
  const configService = app.get(ConfigService);

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not defined in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  // Enable CORS for frontend
  // 許可するオリジンは環境変数CORS_ALLOWED_ORIGINSで設定
  const corsOrigins = configService.get<string[]>('cors.origins');
  app.enableCors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
  });

  // サーバーポートは環境変数PORTで設定（デフォルト: 3000）
  const port = configService.get<number>('port', 3000);
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`CORS enabled for origins:`, corsOrigins);
}
void bootstrap();
