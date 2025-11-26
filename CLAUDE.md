# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time chat application built as a monorepo with Japanese documentation. Uses Yarn 4 with Corepack as the package manager throughout.

## Common Commands

### Backend (NestJS)

```bash
cd backend
yarn install              # Install dependencies
yarn start:dev            # Development server with hot reload
yarn build                # Production build
yarn lint                 # ESLint with --fix
yarn format               # Prettier formatting

# Prisma
yarn prisma:generate      # Generate Prisma client
yarn prisma:migrate       # Run migrations (development)
yarn prisma:studio        # Open Prisma Studio GUI
```

### Frontend (Next.js)

```bash
cd frontend
yarn install              # Install dependencies
yarn dev                  # Development server on port 3001
yarn build                # Production build
yarn lint                 # ESLint
yarn format               # Prettier formatting
yarn format:check         # Check formatting without writing
```

### Docker Development

```bash
docker compose up -d                    # Start all services
docker compose down                     # Stop all services
docker compose logs -f backend          # Follow backend logs
docker compose exec backend yarn prisma:migrate  # Run migrations in container
docker compose up -d --build            # Rebuild after Dockerfile changes
docker compose down -v                  # Stop and clear DB data
```

## Architecture

### Backend (`backend/`)

NestJS 11 API server with the following module structure:

- **AuthModule**: JWT authentication using Passport, guards at `/src/auth/guards/`
- **ChatModule**: WebSocket gateway using Socket.IO at `/src/chat/chat.gateway.ts`, handles room join/leave and message broadcasting
- **UsersModule**: User CRUD operations
- **PrismaModule**: Database abstraction at `/src/prisma/`, shared across modules
- **HealthModule**: Health check endpoints

Key patterns:
- All modules follow NestJS conventions: `*.module.ts`, `*.controller.ts`, `*.service.ts`
- WebSocket authentication via `WsJwtAuthGuard` extracts user from JWT in socket handshake
- DTOs use class-validator decorators for validation
- Swagger documentation auto-generated at `/api`

### Frontend (`frontend/`)

Next.js 16 with App Router architecture:

- **Route Groups**: `(auth)/` for login/signup, `(main)/` for authenticated pages
- **Features Module Pattern**: Each feature (`auth`, `chat`) contains its own `api/`, `components/`, `hooks/`, `store/`, `schemas/`, `types/`
- **State Management**: Zustand stores with devtools middleware (see `features/chat/store/chat-store.ts`)
- **Data Fetching**: TanStack Query for REST API calls, custom hooks wrap queries
- **WebSocket Client**: Singleton service at `lib/socket.ts` with automatic reconnection (exponential backoff)
- **API Client**: Fetch-based client at `lib/api-client.ts` with automatic JWT injection

UI stack: Tailwind CSS v4 + shadcn/ui components at `components/ui/`

### Database

MySQL 8 with Prisma ORM. Schema at `backend/prisma/schema.prisma`:
- `User` → has many `Message`
- `ChatRoom` → has many `Message`
- `Message` → belongs to `User` and `ChatRoom`

### Real-time Communication Flow

1. Frontend connects via Socket.IO with JWT in auth header
2. `WsJwtAuthGuard` validates token and attaches user to socket
3. Client emits `joinRoom`/`leaveRoom` to manage room membership
4. Client emits `sendMessage`, gateway saves to DB and broadcasts `messageCreated` to room

## Environment Setup

### Local Development (no Docker)

Requires Node.js 22 LTS. Enable Corepack:
```bash
corepack enable
```

Backend: Copy `.env.example` to `.env.development`, set `DATABASE_URL` for local MySQL
Frontend: Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_URL`

### Docker Development

Environment files `.env.docker` are pre-configured for container networking. Default ports:
- Frontend: 3001 (host) → 3000 (container)
- Backend: 3000
- MySQL: 3307 (host) → 3306 (container)

## ESLint Configuration

Backend: Strict TypeScript rules with `@typescript-eslint/no-explicit-any: error`, Prettier integration
Frontend: Next.js core-web-vitals + TypeScript recommended rules

## Documentation

Design documents and implementation details in `docs/`:
- `00_planning/` - Database design
- `10_implementation/` - Detailed implementation specs for backend/frontend features
- `20_decisions/` - ADRs for technology choices
