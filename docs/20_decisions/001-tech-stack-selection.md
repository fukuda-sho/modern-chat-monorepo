# [ADR-001] Tech Stack Selection (Next.js & NestJS)

## Status
Accepted

## Context
We are building a modern, real-time chat application that requires a robust, scalable, and type-safe architecture. We need to select a frontend and backend framework that facilitates rapid development while maintaining high code quality and separation of concerns.

### Alternatives Considered
- **Frontend:** React (SPA with Vite), Vue.js, Angular.
- **Backend:** Express.js (minimalist), Fastify, Django/Rails (different languages).
- **Fullstack Monolith:** Next.js API Routes only (Serverless).

## Decision
We have decided to use **Next.js (App Router)** for the frontend and **NestJS** for the backend.

- **Next.js:** Provides a powerful React framework with built-in routing, optimization, and server-side rendering capabilities. The App Router offers a modern paradigm for layouts and data fetching.
- **NestJS:** Offers an opinionated, Angular-inspired architecture for Node.js. It enforces modularity, dependency injection, and uses TypeScript by default, which aligns perfectly with our goal of a structured and maintainable backend.

## Consequences

- **Good:**
    - **Type Safety:** Both frameworks support TypeScript natively, allowing for shared types (potentially via monorepo or shared packages) and reducing runtime errors.
    - **Structure:** NestJS forces a modular architecture, preventing "spaghetti code" as the backend grows.
    - **Performance:** Next.js optimizes frontend delivery (SSR/SSG), while NestJS (on Fastify or Express) provides a performant server runtime.
    - **Ecosystem:** Both have massive ecosystems and community support.

- **Bad:**
    - **Complexity:** NestJS has a steeper learning curve compared to simple Express.js apps due to its use of decorators and DI.
    - **Boilerplate:** Both frameworks introduce some boilerplate code compared to micro-frameworks.
    - **Separation Overhead:** Managing two distinct projects (Frontend/Backend) adds deployment and development complexity compared to a monolith.
