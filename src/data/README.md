# Data Layer

The only place Prisma is imported. Wraps persistence behind repository abstractions.

## Rules

- Prisma is restricted to this layer (enforced by ESLint + architecture tests).
- Exposes repository interfaces consumed by the Application layer.
- No commerce models or migrations in the Foundation Spec (FR-2). Connectivity is verified
  via a trivial health check (`SELECT 1`).
