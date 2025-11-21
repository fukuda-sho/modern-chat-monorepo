import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(userId: number, roomId: number, content: string) {
    return this.prisma.message.create({
      data: {
        userId,
        chatRoomId: roomId,
        content,
      },
      include: {
        user: {
          select: { username: true, email: true },
        },
      },
    });
  }
}
