# Application Layer

Orchestrates use-cases across the Domain, Data, and Integration layers. Enforces
authorization and input validation at the boundary.

## Rules

- MAY import Domain, Data (repository interfaces), and Integration (provider interfaces).
- MUST NOT import Prisma directly (Data layer owns Prisma).
- MUST NOT import provider SDKs directly (Integration layer owns them).
- MUST NOT import Better Auth directly (Auth layer owns it; call it through `AuthService`).
- UI calls Application services; Application never imports UI.
