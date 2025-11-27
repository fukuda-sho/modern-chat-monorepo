-- AlterTable
ALTER TABLE `chat_rooms` ADD COLUMN `description` VARCHAR(500) NULL,
    ADD COLUMN `type` ENUM('PUBLIC', 'PRIVATE', 'DM') NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE `channel_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `chat_room_id` INTEGER NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `is_starred` BOOLEAN NOT NULL DEFAULT false,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_read_at` DATETIME(3) NULL,
    `last_read_message_id` INTEGER NULL,

    INDEX `idx_channel_members_user_id`(`user_id`),
    INDEX `idx_channel_members_chat_room_id`(`chat_room_id`),
    UNIQUE INDEX `channel_members_user_id_chat_room_id_key`(`user_id`, `chat_room_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_chat_rooms_type` ON `chat_rooms`(`type`);

-- AddForeignKey
ALTER TABLE `channel_members` ADD CONSTRAINT `channel_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `channel_members` ADD CONSTRAINT `channel_members_chat_room_id_fkey` FOREIGN KEY (`chat_room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
