# Backend Authentication System Specification

## Overview
This document outlines the implementation details for the authentication system in the NestJS backend. We will use **Passport** with **JWT** strategy for secure, stateless authentication.

## Architecture

### Modules
- **AuthModule**: Handles authentication logic (login, signup, JWT signing).
- **UsersModule**: Manages user data.
- **PrismaModule**: Provides database access.

### Dependencies
- `@nestjs/passport`: NestJS integration for Passport.
- `@nestjs/jwt`: JSON Web Token utilities.
- `passport`: Authentication middleware.
- `passport-jwt`: JWT strategy.
- `bcrypt`: Password hashing.

## Authentication Flow

### 1. Signup
- **Endpoint**: `POST /auth/signup`
- **Body**: `{ username, email, password }`
- **Process**:
    1.  Hash password using `bcrypt`.
    2.  Create user in DB via `UsersService`.
    3.  Return user info (excluding password).

### 2. Login
- **Endpoint**: `POST /auth/login`
- **Body**: `{ email, password }`
- **Process**:
    1.  Validate user credentials (check email, compare password hash).
    2.  If valid, generate JWT containing `sub` (userId) and `username`.
    3.  Return `{ access_token: string }`.

### 3. Protected Routes
- **Guard**: `JwtAuthGuard` (extends `AuthGuard('jwt')`)
- **Strategy**: `JwtStrategy`
    - Extracts JWT from `Authorization: Bearer <token>` header.
    - Validates signature and expiration.
    - Returns `user` object attached to Request.

## API Endpoints

| Method | URL | Protected | Description |
|---|---|---|---|
| POST | `/auth/signup` | No | Register a new user |
| POST | `/auth/login` | No | Login and receive JWT |
| GET | `/users/me` | **Yes** | Get current user profile |

## Directory Structure
```
backend/src/
├── auth/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── signup.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── app.module.ts
```
