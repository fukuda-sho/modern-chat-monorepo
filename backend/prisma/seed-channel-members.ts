/**
 * @fileoverview Data migration script for channel membership
 * @description Populates channel_members table for existing users and channels
 *
 * Strategy:
 * 1. Add all users to the "general" channel as MEMBER
 * 2. Set channel creators as OWNER for their channels
 *
 * Usage: npx ts-node prisma/seed-channel-members.ts
 */

import { PrismaClient, MemberRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Starting channel membership data migration...');

  // Step 1: Get all users and the "general" channel
  const users = await prisma.user.findMany({ select: { id: true } });
  const generalChannel = await prisma.chatRoom.findUnique({
    where: { name: 'general' },
    select: { id: true },
  });

  if (generalChannel) {
    console.log(`Found "general" channel (ID: ${generalChannel.id})`);

    // Add all users to general channel as MEMBER
    const memberships = users.map((user) => ({
      userId: user.id,
      chatRoomId: generalChannel.id,
      role: MemberRole.MEMBER,
      isStarred: false,
    }));

    // Use createMany with skipDuplicates to avoid conflicts
    const result = await prisma.channelMember.createMany({
      data: memberships,
      skipDuplicates: true,
    });

    console.log(`Added ${result.count} users to "general" channel`);
  } else {
    console.log('No "general" channel found. Creating one...');

    // Create general channel if it doesn't exist
    const newGeneral = await prisma.chatRoom.create({
      data: {
        name: 'general',
        description: 'General discussion channel for everyone',
      },
    });

    // Add all users to the new general channel
    const memberships = users.map((user) => ({
      userId: user.id,
      chatRoomId: newGeneral.id,
      role: MemberRole.MEMBER,
      isStarred: false,
    }));

    await prisma.channelMember.createMany({
      data: memberships,
      skipDuplicates: true,
    });

    console.log(`Created "general" channel and added ${users.length} users`);
  }

  // Step 2: Set creators as OWNER for their channels
  const channelsWithCreators = await prisma.chatRoom.findMany({
    where: {
      createdByUserId: { not: null },
    },
    select: {
      id: true,
      createdByUserId: true,
      name: true,
    },
  });

  console.log(`Found ${channelsWithCreators.length} channels with creators`);

  for (const channel of channelsWithCreators) {
    if (channel.createdByUserId) {
      // First, ensure the creator is a member
      await prisma.channelMember.upsert({
        where: {
          userId_chatRoomId: {
            userId: channel.createdByUserId,
            chatRoomId: channel.id,
          },
        },
        create: {
          userId: channel.createdByUserId,
          chatRoomId: channel.id,
          role: MemberRole.OWNER,
          isStarred: false,
        },
        update: {
          role: MemberRole.OWNER,
        },
      });
      console.log(`Set creator as OWNER for channel "${channel.name}"`);
    }
  }

  console.log('Channel membership migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
