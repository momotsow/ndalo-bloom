# Auth Layer

The only place the Better Auth implementation is imported. Exposes authentication behind
the `AuthService` abstraction.

## Dependency direction

```
app / UI
    ↓
Application
    ↓
AuthService  (abstraction)
    ↓
Better Auth  (implementation — restricted to this layer)
```

## Rules

- Better Auth implementation code is restricted to `src/auth/` (enforced by ESLint +
  architecture tests).
- `app/`, `src/ui/`, `src/application/`, and `src/domain/` MUST NOT import Better Auth.
- Foundation establishes ONLY the `AuthService` abstraction, the wiring boundary, roles
  (`CUSTOMER`, `ADMIN`, `SUPER_ADMIN`), and session/auth contracts. No auth screens/flows.
