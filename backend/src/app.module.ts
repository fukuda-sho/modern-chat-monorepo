import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import configuration from './config/app.config';

/**
 * アプリケーションのルートモジュール
 *
 * ConfigModuleをグローバルモジュールとして設定し、
 * アプリケーション全体で環境変数にアクセスできるようにします。
 */
@Module({
  imports: [
    // グローバルに設定を利用可能にする
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
      // 本番環境では環境変数ファイルを使用しない
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
