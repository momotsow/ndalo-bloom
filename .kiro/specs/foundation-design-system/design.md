# Foundation & Design System — Design

**Spec:** foundation-design-system
**Status:** Awaiting implementation approval.

## 1. Layering & Dependency Direction

```
app/ (pages, server components, api route handlers)  ──► Application services
Application ──► Domain
Application ──► Data (repositories) and Integration (adapters) via interfaces
Domain ──► (no outward dependencies on framework / infrastructure / provider)
Data ──► Prisma only
Integration ──► provider SDKs only
auth/ ──► Better Auth only
```

Rules enforced by tooling (ESLint + architecture tests):
- UI (`app/`, `ui/`) never imports Prisma or provider SDKs.
- `app/` pages and `app/api` handlers route through Application services.
- Domain imports no framework, infrastructure, or provider code.
- Prisma is restricted to the data layer.
- Provider SDKs are restricted to the integration layer.
- Better Auth implementation is restricted to the auth layer.

## 2. Prisma Bootstrap (Minimal)

- A singleton Prisma client lives in the data layer.
- A `HealthRepository` exposes a connectivity check (`SELECT 1`).
- Repository-pattern conventions are documented.
- No `schema.prisma` commerce models. Any tables required by the Better Auth Prisma
  adapter are auth infrastructure, generated per Better Auth documentation — explicitly
  not commerce domain models.

## 3. Configuration Model

Four config modules, each with an independent Zod schema:

- `config/public.ts` — `NEXT_PUBLIC_*` only, safe for the browser bundle.
- `config/server.ts` — server-only secrets; imported only in server code; guarded so it
  can never reach client bundles.
- `config/integration.ts` — per-provider config, validated lazily on first use of a
  provider adapter (feature-scoped).
- `config/build.ts` — only variables genuinely needed at build time.

Behaviour (implements FR-7):
- WHEN a required configuration value is missing or malformed, the dependent feature fails
  before executing, via the validated Zod module.
- Errors report the missing/invalid key name and expectation, never the value.
- Build-time configuration is validated only when genuinely required during the build.

## 4. Design Tokens

Primitive tokens → semantic tokens → Tailwind theme mapping.

- Primitive tokens: colour palette (including brand pinks), spacing scale, typography scale
  (editorial), radius scale, shadow scale, sizing, motion durations/easings.
- Semantic tokens: background, surface, surface-muted, text-primary, text-secondary,
  text-muted, border, accent (mapped to pink), focus, success, warning, error, and
  interactive states (hover / active / disabled / focus-visible).
- Delivered as CSS variables mapped into the Tailwind theme; components consume semantic
  tokens only.
- Rebrand / theme changes are achieved by swapping semantic mappings, without editing
  individual components. Additional themes (e.g. dark) can be added as further semantic
  mappings later.

## 5. Components

- Server-first: layout/content and state primitives are React Server Components.
- Client components only where interaction requires them: Dialog, Toast, Drawer/Sheet, and
  interactive form controls.
- Radix underpins interactive primitives for correct ARIA and focus behaviour.

### Drawer/Sheet decision
Radix has no dedicated Drawer primitive. The Drawer/Sheet is built on **Radix Dialog**
(modal semantics, focus trap, `aria-modal`, ESC/overlay dismissal) with slide-in styling
and reduced-motion support. This reuses Radix's proven accessibility rather than adding a
new dependency. A non-modal variant can be evaluated later if a use case requires it.

## 6. Accessibility Design

- Radix for ARIA/focus correctness.
- Visible focus states via focus tokens.
- Reduced motion honoured via `prefers-reduced-motion`.
- Documented accessible-name expectations per component.
- axe runs in CI as a necessary but not sufficient check; manual assistive-technology
  testing is part of Definition of Done for interactive primitives.

## 7. Observability

- Sentry wired with PII scrubbing (server-only in Foundation; client reporting deferred
  pending decision).
- Vercel Speed Insights wired for performance measurement.

## 8. Storybook (recommended)

Recommended for isolated component development, living documentation, and a home for
jest-axe and later visual regression. Dev-only dependency; no runtime/bundle cost. If not
adopted, the fallback is co-located MDX docs + React Testing Library + jest-axe and a
lightweight docs route. Final decision is a human approval item.

## 9. Visual Regression Readiness

Not a mandatory Foundation requirement. The token system and (if adopted) Storybook stories
keep the architecture compatible with introducing a visual regression tool (Chromatic or
Playwright screenshots) in a later Spec.

## 10. Architecture Decisions

- **AD-1** Minimal Prisma bootstrap — wire client + repository conventions + connectivity
  check only; no commerce models. Demonstrates the data-layer pattern via a health
  repository.
- **AD-2** Categorized, lazy config validation — split config by audience; validate
  feature-scoped; keep secrets out of the browser.
- **AD-3** Dual architecture enforcement — ESLint import rules plus architecture tests with
  invalid fixtures proving the gate fails.
- **AD-4** Framework/infra/provider-independent domain (not zero-dependency) — permit small
  pure libraries; see Dependencies.
- **AD-5** Two-tier semantic tokens — enables rebrand/theme without touching components;
  pink stays an accent.
- **AD-6** Radix where meaningful; Drawer/Sheet on Radix Dialog.
- **AD-7** Storybook — recommended; decision deferred to human approval.
- **AD-8** Visual regression — readiness, not requirement.

## 11. Dependencies

Runtime: Next.js, React, TypeScript, Tailwind CSS, Zod, Better Auth, Prisma +
@prisma/client, Radix primitives (dialog, select, checkbox, radio-group, label, toast),
Sentry, Vercel Speed Insights.

Dev/CI: ESLint + import-boundary rules, Vitest + React Testing Library (recommended),
jest-axe / axe-core, Playwright (harness only), Prettier, Storybook (if approved).

Permitted domain-layer libraries: pure utilities only — Zod (schema/value validation) and
a decimal/money helper for integer-cents arithmetic if needed. Disallowed in domain:
Next.js, React, Prisma, any provider SDK, Better Auth, any I/O or environment access.

No dependencies are installed by this Spec; this is the proposed manifest.

## 12. Proposed Repository / File Layout

```
ndalo-bloom/
├─ app/
│  ├─ layout.tsx, page.tsx            # minimal editorial shell + token showcase (dev only)
│  └─ api/health/route.ts             # calls Application → HealthRepository (no direct Prisma)
├─ src/
│  ├─ domain/                         # pure value objects only (no commerce)
│  ├─ application/                    # HealthService, AuthService (abstraction)
│  ├─ data/                           # prisma client, HealthRepository, repository conventions
│  ├─ integrations/                   # provider interfaces only (no adapters yet)
│  ├─ auth/                           # Better Auth wiring behind AuthService
│  ├─ config/                         # public.ts, server.ts, integration.ts, build.ts (Zod)
│  ├─ ui/
│  │  ├─ tokens/                      # primitive + semantic token definitions
│  │  ├─ primitives/                  # foundational components (see requirements)
│  │  └─ docs/                        # component docs (MDX or Storybook)
│  └─ lib/
├─ tests/
│  ├─ unit/                           # token + pure util tests
│  ├─ components/                     # component + axe tests
│  └─ architecture/
│     └─ fixtures/invalid/            # e.g. ui-imports-prisma.ts (must be rejected)
├─ .eslintrc / eslint.config          # import-boundary rules
├─ .env.example                       # documented placeholders only
└─ package.json / tsconfig (strict)
```
