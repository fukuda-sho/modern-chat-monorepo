/**
 * @fileoverview Prisma モジュール
 * @description PrismaService を提供するグローバルモジュール
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma モジュールクラス
 * @description @Global デコレータにより、全モジュールから PrismaService を利用可能にする
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
