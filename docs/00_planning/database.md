# Database Design

## Overview
This document outlines the database schema and configuration for the Real-time Chat Application. We are using **MySQL (Latest)** as the relational database management system.

## ER Diagram (Description)
The database consists of three main entities: `User`, `ChatRoom`, and `Message`.

- **User**: Represents a registered user.
- **ChatRoom**: Represents a chat room where multiple users can converse.
- **Message**: Represents a text message sent by a user in a chat room.

### Relationships
- **User <-> ChatRoom (Many-to-Many)**: A user can join multiple chat rooms, and a chat room can have multiple users. This is managed via an implicit join table in Prisma.
- **User -> Message (One-to-Many)**: A user can send multiple messages.
- **ChatRoom -> Message (One-to-Many)**: A chat room contains multiple messages.

## Schema Definitions

### User
| Field | Type | Description |
|---|---|---|
| `id` | Int | Primary Key, Autoincrement |
| `username` | String | Unique username |
| `email` | String | Unique email address |
| `password` | String | Hashed password |
| `createdAt` | DateTime | Timestamp of creation |

### ChatRoom
| Field | Type | Description |
|---|---|---|
| `id` | Int | Primary Key, Autoincrement |
| `name` | String | Name of the chat room |
| `createdAt` | DateTime | Timestamp of creation |

### Message
| Field | Type | Description |
|---|---|---|
| `id` | Int | Primary Key, Autoincrement |
| `content` | String (Text) | Content of the message (supports long text) |
| `userId` | Int | Foreign Key to User |
| `chatRoomId` | Int | Foreign Key to ChatRoom |
| `createdAt` | DateTime | Timestamp of creation |

## Configuration & Constraints

### MySQL (Latest)
- **Character Set**: `utf8mb4` is used to support full Unicode characters, including emojis.
- **Collation**: `utf8mb4_unicode_ci` for accurate sorting and comparison.
- **Engine**: InnoDB (default) for transaction support.

### Prisma
- **Provider**: `mysql`
- **Relation Mode**: Foreign keys are enforced by the database.
