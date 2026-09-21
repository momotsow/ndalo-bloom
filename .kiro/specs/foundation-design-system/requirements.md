# Foundation & Design System — Requirements

**Spec:** foundation-design-system
**Status:** Approved in principle (revisions applied). Awaiting implementation approval.
**Source of truth:** Ndalo Bloom Master Product Brief and steering documents.

## Purpose

Establish the architectural skeleton, quality gates, environment/configuration model,
design-token system, and a set of framework-agnostic foundational UI primitives for
Ndalo Bloom. This Spec proves the architecture is not only documented but actively
enforced by tooling.

Out of scope: commerce models, commerce UI, and any migrations. No commerce-specific
functionality is built here.

## Functional Requirements

Requirements use EARS-style phrasing.

### FR-1 — Project skeleton
The system SHALL establish a Next.js App Router TypeScript (strict mode) project with the
layered structure (Domain / Application / Data / Integration / UI) and SHALL enforce the
dependency direction between layers.

### FR-2 — Prisma bootstrap (minimal)
The system SHALL configure Prisma (client wiring, data-layer conventions, repository
abstraction, and minimal connectivity verification). It SHALL NOT define any commerce
models (no Product, Customer, Order, Cart, Payment, Inventory, or similar) and SHALL NOT
create commerce migrations. Connectivity MAY be verified without a domain schema
(for example, a trivial `SELECT 1` health check).

### FR-3 — Repository abstraction
The system SHALL define a repository pattern so that the data layer is the only place
Prisma is imported, without introducing concrete commerce repositories.

### FR-4 — Authentication foundation
The system SHALL configure Better Auth behind an `AuthService` abstraction with
email/password authentication, email verification, password reset, secure sessions, and
the role model (`CUSTOMER`, `ADMIN`, `SUPER_ADMIN`). Full authentication flows and screens
are out of scope beyond wiring and role definition.

### FR-5 — Design tokens
The system SHALL define a two-tier token architecture (primitive tokens and semantic
tokens) expressed as CSS variables and consumed via Tailwind. Components SHALL primarily
consume semantic tokens. Ndalo Bloom's pink SHALL exist as an accent within the semantic
token system and SHALL NOT be hard-coded throughout components.

### FR-6 — Foundational components
The system SHALL implement the in-scope foundational primitives (layout/content, form,
interaction, and state patterns) and SHALL NOT implement any commerce-specific components.

### FR-7 — Environment configuration
WHEN a configuration value required by a feature is missing or malformed, the system SHALL
fail before that feature executes, with a clear, non-sensitive error via a validated Zod
configuration module. Build-time configuration SHALL only be validated when genuinely
required during the build process.

Supporting design detail:
- Configuration SHALL be categorized into public/browser, server-only, integration, and
  build-time modules.
- Configuration SHALL NOT be validated unconditionally at application startup; validation
  is feature-scoped.
- Server secrets SHALL never be included in client bundles.
- Error messages SHALL name the offending variable and its expectation, never the secret
  value.

### FR-8 — Architecture enforcement
The system SHALL enforce boundaries with both ESLint import rules and automated
architecture boundary tests. Neither `app/` route/page code nor `app/api` route handlers
may import Prisma or provider SDKs directly; both SHALL call Application services. Tests
SHALL include deliberately invalid import fixtures proving the CI gate catches them.

Intended flow:
```
app/ page or server component  → Application service
app/api route handler          → Application service
Application → Domain
Application → Data / Integration through defined abstractions
```

### FR-9 — Domain dependency rule
The domain layer SHALL be framework-independent, infrastructure-independent, and
provider-independent. This SHALL NOT be an artificial "zero-dependency" rule; permitted
lightweight libraries SHALL be documented with justification.

### FR-10 — Accessibility
Every interactive primitive SHALL be tested for keyboard operation, focus visibility,
focus order, accessible name, correct semantic role, disabled state, loading state (where
applicable), error state (where applicable), screen-reader behaviour (where relevant),
reduced motion (where applicable), and colour contrast. Automated axe checks SHALL run in
CI. The Spec SHALL NOT claim that axe alone proves accessibility.

### FR-11 — Performance
Foundational components SHALL avoid unnecessary client-side JavaScript and SHALL be
server-compatible by default. Client components SHALL be introduced only where interaction
requires them. No global client-side state solution SHALL be introduced unless genuinely
required by the foundation.

### FR-12 — Component documentation
Every foundational component SHALL document its purpose, intended usage, accessibility
expectations, supported variants, states, responsive behaviour, examples, and prohibited
usage where relevant.

### FR-13 — Radix usage
Radix primitives SHALL be used where they provide meaningful accessibility and interaction
value (for example Dialog, Select, Checkbox, Radio, Label, Toast). Radix SHALL NOT be
required where it offers no appropriate primitive. The Drawer/Sheet approach SHALL be
evaluated and the decision documented.

### FR-14 — Observability foundation
The system SHALL wire error monitoring (Sentry, with PII scrubbing) and performance
measurement (Vercel Speed Insights) at a foundational level.

### FR-15 — CI quality gates
CI SHALL run format checks, ESLint (including boundary rules), strict TypeScript
type-checking, unit and component tests, architecture boundary tests, axe accessibility
checks, and a production build, and SHALL fail on any violation.

## Non-Functional Requirements

- Strict typing everywhere; no implicit `any`.
- No secrets in client bundles.
- Server-first rendering by default.
- Documented, theme-swappable tokens.
- Deterministic CI.

## In Scope — Components

- Layout/content: Container, Stack, Grid, Heading, Text, Card, Badge, Image
- Form: Label, Input, Textarea, FormField, Select, Checkbox, Radio
- Interaction: Button, Link, Dialog, Toast, Drawer/Sheet pattern
- State: Loading, Empty, Error

## Out of Scope — Components

ProductCard, ProductGallery, AddToCartButton, CheckoutForm, product filters, pricing
components, product recommendation components, and any other commerce-specific UI. These
belong to later Specs.

## Acceptance Criteria (summary)

- Layered structure exists and dependency direction is enforced.
- Prisma is wired with a working connectivity check and no commerce models/migrations.
- Config is categorized; no server secret appears in any client bundle; required config is
  validated before the dependent feature runs; errors never expose values.
- Two-tier tokens exist; components consume semantic tokens; pink is an accent token.
- All in-scope primitives are implemented; no commerce components are present.
- Every interactive primitive passes the full accessibility test matrix; axe runs in CI.
- Every component is documented per FR-12.
- Radix is used where meaningful; the Drawer/Sheet decision is documented.
- Foundational components avoid unnecessary client JS; no global client-state solution is
  introduced unless justified.
- **Architecture boundary tests SHALL demonstrate that prohibited imports fail the
  configured quality gate.**
