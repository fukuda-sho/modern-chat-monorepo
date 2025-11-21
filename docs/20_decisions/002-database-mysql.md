# [ADR-002] Database Selection (MySQL)

## Status
Accepted

## Context
We need a relational database to store user data, chat rooms, and messages. While PostgreSQL is often the default choice for modern web applications due to its advanced features (JSONB, extensions), we must balance technical superiority with team velocity and existing constraints.

### Alternatives Considered
- **PostgreSQL:** The industry standard for modern open-source RDBMS.
- **MongoDB:** NoSQL option, good for unstructured chat logs but weaker on relational integrity (User-Room-Message relations).
- **SQLite:** Good for prototyping, but lacks concurrency for a real-time multi-user chat app.

## Decision
We have decided to use **MySQL 8.0**.

Although PostgreSQL offers advanced features, MySQL is chosen primarily to leverage the development team's existing high proficiency and familiarity. MySQL 8.0 is a robust, mature, and performant database that fully satisfies our requirements (ACID compliance, JSON support, foreign keys).

## Consequences

- **Good:**
    - **Velocity:** The team can start immediately without the learning curve or operational friction of a less familiar DB.
    - **Stability:** MySQL is battle-tested and widely supported by all major cloud providers and ORMs (Prisma).
    - **Sufficiency:** For a standard chat schema (Users, Rooms, Messages), MySQL's relational capabilities are more than sufficient.

- **Bad:**
    - **Feature Set:** We miss out on some specific Postgres features (e.g., superior GIS support, transactional DDL) which might be useful in edge cases, though unlikely for this scope.
    - **Strictness:** MySQL can sometimes be more lenient with data types/constraints than Postgres, requiring careful schema definition (handled by Prisma).
