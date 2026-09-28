# Spec 3 Tasks — Shopping Cart (Commerce Foundation, Phase 1)

**Status:** Tasks — awaiting review. Do NOT implement until approved.
**Depends on:** Requirements (approved/closed), Design (approved/closed).

## Scope guard (applies to every task)
Preserve Spec 1/2 invariants: UI → Application → Domain → Data/Integration → Providers; UI
never imports Prisma/provider SDKs; Prisma only in `src/data`; domain framework/provider-
independent; Zod at boundaries; money in integer ZAR cents. Guest-only cart. No checkout,
orders, payments, shipping, promotions, discounts, gifting, auth flows/ownership, cart
merge, operational inventory (reservation/deduction/release/warehouses), wishlist, reviews,
loyalty, referrals, UGC, AI, or tax. Catalogue remains the source of truth; cart persists
intent only. Exactly nine emittable analytics events (5 catalogue + 4 cart). Additive
migration only (UTF-8 no BOM); never edit `20260918124342_catalogue_init`.

Tasks are ordered for dependency safety. Each maps to Requirements (FR/…)/Design (§).

---

- [ ] 1. Cart domain layer (`src/domain/cart`)
  - `Quantity` value object (`1..99`, integer; reject 0/neg/non-int); `increment(by)` that
    clamps to 99 and reports `{ value, clamped }`; `MIN_QUANTITY`/`MAX_QUANTITY`.
  - `CartLineIntent` (`variantId`, `quantity`) — intent only, no catalogue facts.
  - Pure operations: `addLine` (additive + clamp-to-99 + `clamped`), `updateLineQuantity`
    (absolute set; reject `>99`/`<1`/non-int), `removeLine`, `clear`.
  - Pure integer-cents math: `computeLineSubtotal`, `computeSubtotal` (prices injected).
  - No I/O, no framework/provider/Prisma imports.
  - _Requirements: BR-1..BR-7, PM-1/PM-2, V-2. Design: §1, §quantity-semantics._

- [ ] 2. Cart domain unit tests (DB-free)
  - Quantity bounds; add additive + clamp-to-99 with `clamped`; update rejects `>99`/`<1`/
    non-int; remove/clear; one-line-per-variant merge; integer-cents subtotal math.
  - _Requirements: T-1. Design: §1, §17._

- [ ] 3. Prisma schema + additive migration (Neon; UTF-8 no BOM)
  - Add `Cart(id, token unique, createdAt, updatedAt, expiresAt)` — NO status field.
  - Add `CartItem(id, cartId FK Cart, variantId FK ProductVariant onDelete: Restrict,
    quantity, lastPresentedPriceCents nullable, createdAt, updatedAt)`; unique
    `(cartId, variantId)`; index on `Cart.token` and `Cart.expiresAt`.
  - Generate via normal `prisma migrate` workflow; ensure UTF-8 **without BOM**.
  - Do not alter catalogue tables or `ProductVariant.stockKey`. No inventory/availability
    tables.
  - _Requirements: FR-8, M-1/M-2/M-3, IB-1. Design: §3, §5, §6, §18._

- [ ] 4. Cart data layer (`src/data/cart`)
  - Prisma-only `cart-repository` returning plain row shapes (no Prisma types leaked up).
  - Methods: `findByToken`, `create`, atomic add upsert
    (`on conflict (cartId,variantId) do update set quantity = LEAST(quantity + EXCLUDED.quantity, 99)`),
    `setItemQuantity`, `deleteItem`, `deleteAllItems`, `listItems`, `touch(expiresAt)`.
  - One transaction per mutation, scoped to a `cartId`; add is a single atomic upsert (no
    app-level read-modify-write).
  - _Requirements: E-4, IB-1. Design: §3, §6, §transaction-boundaries._

- [ ] 5. Read-only stock + catalogue read-through wiring (Application-side)
  - Reuse Spec 2 `ReadOnlyStockAvailabilityProvider` and catalogue read path to resolve
    current variant facts (product name, variant name, unit price, hero image) + availability
    for a set of `variantId`s in bounded queries (no N+1).
  - Tolerate missing/inactive variant → mark line unavailable (kept, not dropped).
  - _Requirements: ST-1..ST-3, FR-7, IB-2, P-2. Design: §7, §8._

- [ ] 6. Cart read models + Zod schemas (`src/application/cart/read-models.ts`)
  - `CartLineReadModel` (variantId, productSlug, productName, variantName, unitPriceCents,
    quantity, lineSubtotalCents, availability, unavailable, priceUpdated, heroImage) and
    `CartReadModel` (cartId, currency ZAR, lines, itemCount, subtotalCents, anyPriceUpdated,
    notices). Validated at the application boundary.
  - Subtotal only — no tax/shipping/discount computation.
  - _Requirements: FR-4, FR-10, PM-4, §10. Design: §10._

- [ ] 7. CartService application use-cases (`src/application/cart`)
  - `getOrCreateCart`, `addItem`, `updateItemQuantity`, `removeItem`, `clearCart`, `getCart`.
  - Compose domain + repository + catalogue read-through + availability + price injection;
    Zod-validate inputs and outgoing read model; map to typed error model.
  - Price handling: always current `ProductVariant.priceCents`; compute `priceUpdated`
    per-line and `anyPriceUpdated`; update `lastPresentedPriceCents` to current price after
    each presentation (never used for pricing/display).
  - Refresh `expiresAt = now + 30 days` on activity.
  - _Requirements: FR-1..FR-3, FR-5/FR-6/FR-13, PM-1..PM-3/PM-5, ST-1..ST-3, BR-1. Design: §2, §5, §8._

- [ ] 8. Typed error model (`src/application/cart`)
  - `VariantNotFound`, `VariantNotPurchasable`, `InvalidQuantity`, `InvalidCartToken`,
    `CartNotFound` (empty-cart resolution where appropriate); safe customer messages; no
    internal leakage. Notices (`MAX_QUANTITY_REACHED`, `PRICE_UPDATED`) are not errors.
  - _Requirements: V-3, E-1..E-6. Design: §11._

- [ ] 9. Guest token + cookie strategy (app/route boundary)
  - Opaque, unguessable, server-issued token; http-only/Secure/SameSite=Lax cookie; 30-day
    max-age; refreshed on activity consistent with `expiresAt`. Cookie I/O in the app/route
    layer; Application receives token via request context (never UI).
  - _Requirements: FR-1, FR-8, S-2. Design: §4, §5._

- [ ] 10. Server actions / route contracts (`app`)
  - `addItem`, `updateItemQuantity`, `removeItem`, `clearCart`, `getCart` → `CartReadModel`
    or typed error; Zod-validate inputs; call `CartService`; perform cookie issue/refresh.
  - No Prisma/provider imports here.
  - _Requirements: FR-11/FR-12, V-1, S-1/S-3. Design: §9._

- [ ] 11. Rate limiting on mutation entrypoints
  - Per-token + per-IP sliding-window limit on add/update/remove/clear; reject abuse; reuse/
    extend the existing app approach; no new infrastructure. Evaluate any helper against the
    dependency-audit gate.
  - _Requirements: S-4. Design: §12, §19._

- [ ] 12. Analytics: four cart events via the allow-list boundary
  - Add exactly `add_to_cart`, `cart_viewed`, `cart_quantity_updated`, `remove_from_cart` to
    the AnalyticsProvider allow-list (typed payloads; no PII). Five catalogue events
    unchanged. Emit only from the Application layer.
  - _Requirements: AN-1..AN-4. Design: §15._

- [ ] 13. Cart UI (`src/ui/cart`) — token-driven, no data/provider access
  - `AddToCartButton` (client) → `addItem` action; live-region announcements; max-quantity
    notice. `/cart` page (`app/(store)/cart/page.tsx`, server) rendering `CartReadModel`.
    `CartLineItem` (quantity control, explicit Remove, unavailable flag, per-line price-
    updated), `CartSummary` (subtotal, item count, cart-level price-updated, empty state).
  - Reuse Spec 1 primitives + Spec 2 image view-mapper. Server-first; minimal client JS.
  - _Requirements: FR-4/FR-7/FR-9/FR-11, A-1..A-4, P-1/P-3. Design: §13, §14._

- [ ] 14. SEO for `/cart`
  - Route metadata `robots: { index: false }`; extend `robots.txt` to disallow `/cart`
    (alongside `/search`). No canonical/JSON-LD/sitemap for cart.
  - _Requirements: SEO-1. Design: §16._

- [ ] 15. Observability
  - Route cart mutation failures/validation errors through the existing server-side Sentry
    integration with PII scrubbing; attach only safe context (operation, error code) — never
    token/cart contents/PII.
  - _Requirements: O-1/O-2. Design: §20._

- [ ] 16. Tests: application, component/axe, security, analytics (DB-free)
  - Application: orchestration with stub stock + stub catalogue; current-price-at-read;
    priceUpdated per-line + cart-level; keep-and-flag unavailable; read-model Zod validation.
  - Component/axe: AddToCartButton, CartLineItem, CartSummary; empty/error/unavailable/
    price-updated states.
  - Security: server rejects tampered price/total/quantity/variant; forged token can't access
    another cart.
  - Analytics allow-list: only the nine approved events emittable.
  - _Requirements: T-2/T-4/T-7/T-8. Design: §17._

- [ ] 17. Architecture boundary tests for new cart modules
  - Extend fixtures: cart UI cannot import Prisma/providers; Prisma restricted to
    `src/data/cart`; domain cart imports no framework/provider.
  - _Requirements: T-6. Design: §0, §17._

- [ ] 18. Integration tests (DB-backed; CI db-verification)
  - Persistence; guest token behaviour; 30-day sliding expiry (activity refreshes
    `expiresAt`; expired treated as absent); unique `(cartId, variantId)`; concurrency-safe
    add (LEAST(current+requested,99)) has no lost updates; read accuracy vs. real Postgres.
  - _Requirements: T-3, E-4. Design: §5, §6, §17._

- [ ] 19. E2E tests (CI; seeded catalogue data)
  - add from product → `/cart` → update qty → remove; unavailable keep-and-flag; guest cart
    persists across navigation; clamp-to-99 notice. Deterministic (use seeded variants).
  - _Requirements: T-5. Design: §17._

- [ ] 20. CI + schema-verify integration
  - DB-free cart tests run in `quality-gates`; migration deploy + seed + schema verify + cart
    integration + cart E2E run in `db-verification` (secret-only DATABASE_URL, no destructive
    resets).
  - `db:verify` MUST (REQUIRED) additionally assert: `Cart` table exists; `Cart.token` is
    unique; `Cart.expiresAt` has the required index; `CartItem` table exists;
    `CartItem(cartId, variantId)` is unique; `CartItem → ProductVariant` FK exists with
    non-cascading (Restrict) delete behaviour; `CartItem.lastPresentedPriceCents` is nullable;
    and forbidden inventory/availability tables still do not exist.
  - _Requirements: M-4, T-3/T-5. Design: §18, §19._

- [ ] 21. Full Definition of Done gate
  - format, lint (incl. boundary rules), strict typecheck, unit/component/axe/architecture/
    analytics tests, production build, Storybook build, dependency audit (DB-free); then
    db-verification (migration/seed/verify/integration/e2e). Verify server-authoritative
    pricing/availability, inventory boundary preserved, `/cart` non-indexable, only nine
    events emittable, accessibility (axe + manual AT).
  - _Requirements: §25 DoD._

## Notes / non-expansion
- No lifecycle status on `Cart`. No tax/discount/shipping computation. No reservation/
  deduction. `lastPresentedPriceCents` is non-authoritative (change-detection only).
- Add-to-cart concurrency is a single atomic DB upsert; no app-level read-modify-write.
- Standing implementation choice (from Design A4): the specific rate-limit mechanism (Task 11).

## Definition of Done (summary; full criteria in requirements.md §25)
All MUST requirements satisfied and traceable to tests; all gates green (DB-free +
db-verification); server-authoritative pricing/availability proven; source-of-truth and
inventory boundary preserved; `/cart` non-indexable; exactly nine analytics events;
accessibility verified; additive migration applied and recorded; no out-of-scope features.
