# Domain Layer

Pure business rules. Framework-independent, infrastructure-independent, and
provider-independent (FR-9).

## Rules

- MUST NOT import Next.js, React, Prisma, provider SDKs, Better Auth, or perform any I/O
  or environment access.
- MAY use pure utility libraries only (currently: `zod` for value validation, and a
  decimal/money helper for integer-cents arithmetic if needed).
- Contains entities, value objects, and business rules.

## Scope note

No commerce models are created in the Foundation Spec. This layer currently holds only
shared pure value objects (if any).
