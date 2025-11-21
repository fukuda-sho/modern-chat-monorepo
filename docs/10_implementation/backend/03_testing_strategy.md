# Backend Testing Strategy

## 1. Test Policy

We aim to ensure the quality of the backend application through a combination of Unit Tests and End-to-End (E2E) Tests.

### Unit Test (`.spec.ts`)
- **Target**: Service layer business logic.
- **Strategy**: Mock external dependencies, specifically database access via Prisma, to verify the correctness of the logic in isolation.
- **Tools**: Jest, `jest-mock-extended`.

### E2E Test (`.e2e-spec.ts`)
- **Target**: Controller layer endpoints.
- **Strategy**: Send actual HTTP requests to the application running in a test environment. Verify that guards, pipes, and interceptors function correctly along with the business logic.
- **Tools**: Jest, `supertest`, `@nestjs/testing`.

## 2. Scope

### Authentication (`AuthService` / `AuthController`)
- Login validation.
- User registration.
- JWT token generation.
- Protected route access control.

### Users (`UsersService`)
- User search logic.
- User creation logic (including password hashing verification).

## 3. Mocking Strategy

### PrismaService Mocking
We will use a mocking strategy to avoid connecting to a real database during unit tests.

- **Tool**: `jest-mock-extended` for type-safe mocking of the Prisma client.
- **Implementation**: 
  - `PrismaService` will be completely mocked in unit tests to isolate Service logic.

