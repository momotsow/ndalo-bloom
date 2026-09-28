# Spec 3 Requirements — Shopping Cart (Commerce Foundation, Phase 1)

**Status:** Requirements — approved in structure; updated with locked decisions. Awaiting
review before Design.
**Depends on:** foundation-design-system (Spec 1), catalogue-product-experience (Spec 2).
**Source of truth:** Ndalo Bloom Master Product Brief + steering documents + approved
Spec 1/2 baseline.

## 1. Specification title
Spec 3 — Shopping Cart (Commerce Foundation, Phase 1).

## 2. Purpose
Establish a trusted, server-authoritative, guest shopping cart: the ability for a guest
customer to add product variants, adjust quantities, remove lines, and view an accurate,
server-computed cart with live availability and current catalogue pricing. This is the
first Commerce capability and the foundation a later Checkout spec will consume.

## 3. Business objective
Let customers assemble purchase intent reliably and safely so a future checkout can convert
it into an order. The cart must be accurate, tamper-resistant, and persistent enough that
customers don't lose their selections — supporting conversion and the brand promise that
the experience feels effortless and trustworthy ("Checkout is sacred": clarity, trust,
speed, mobile usability, accessibility).

## 4. User problems being solved
- Customers need to collect multiple products/variants before committing to buy.
- Customers need confidence that prices and availability in the cart are current.
- Customers must not lose their cart between page views or sessions (within a retention
  window).
- Customers need clear feedback when an item becomes unavailable or its price changes.

## 5. User personas / use cases
- **Guest shopper ("The Busy Bloom", not signed in):** adds items and views a cart without
  creating an account. Guest access is always permitted (Spec 1 `AuthService` contract).
- Spec 3 is **guest-only** (see §7). Authenticated customers are not a Spec 3 persona.
- Use cases: add a variant to cart; change quantity; remove a line; view cart with per-line
  and total pricing; see availability warnings and price-updated notices; empty-cart state;
  unavailable-item handling.

## 6. In-scope capabilities
**MUST include:**
- A cart domain concept and server-authoritative cart state (guest carts only).
- Add a `ProductVariant` to a cart with a quantity.
- Update line quantity; remove a line (explicit remove); view the cart; clear the cart.
- Guest cart via an opaque, server-issued cart token (cookie-based persistence), 30-day
  retention (§ decision 3).
- Server-computed pricing: unit price, line subtotal, cart subtotal — all derived
  server-side from trusted **current** catalogue data at read time (never client-supplied).
- Availability validation at add-time and re-check at cart-read time, consuming Spec 2's
  read-only availability via the existing `ReadOnlyStockAvailabilityProvider`.
- Quantity rules: `1 <= quantity <= 99`, integer-only; reject invalid input.
- Add-existing-variant increments the existing line (capped at 99).
- Keep-and-flag behaviour for items that become unavailable after being added.
- Current-price-at-read behaviour with a non-blocking "price updated" notice.
- A dedicated `/cart` page.
- The four approved commerce analytics events (see §18).
- Accessible cart UI and add-to-cart affordances integrated with the existing catalogue UI.
- Full validation, error states, security, and tests.

**MAY include:**
- Cart line count/badge in navigation.
- An OPTIONAL cart drawer/mini-cart. This MUST NOT become a domain requirement; if built
  (now or later) it MUST consume the same cart application/read-model contracts as `/cart`.
- Display-only placeholders for future discounts/shipping in the cart summary (no
  computation). Tax MUST NOT be represented (see §10 decision 10).

## 7. Out-of-scope capabilities (belong to later specs)
MUST remain out of scope: checkout; order creation/placement; order history; payments
(PayFast/Payflex/PayJustNow) and payment state; shipping (Bob Go), rates, delivery
estimates; promotions/promo codes/discount computation; gifting/gift messages;
authentication screens/flows, registration, verification, password reset, account pages;
**authenticated cart ownership**; **guest-to-authenticated cart merge**; operational
inventory (reservation, deduction, release, receiving, movements, warehouses); wishlist;
reviews; loyalty; referrals; UGC; any AI capability; **tax calculation**.

## 8. Functional requirements (testable)
- **FR-1 (MUST):** The system MUST create or resolve a **guest** cart for the current
  request context using a server-issued cart token. No authenticated/customer association
  is created in Spec 3.
- **FR-2 (MUST):** The system MUST allow adding a `ProductVariant` by its trusted
  identifier with an integer quantity `1..99`. Adding a variant already present MUST
  **increment** the existing line's quantity. If the resulting quantity exceeds 99, the
  quantity MUST be **clamped to 99** (the add MUST NOT be rejected) and an accessible,
  non-blocking notice that the maximum quantity has been reached MUST be surfaced.
- **FR-3 (MUST):** The system MUST allow updating a line's quantity (validated `1..99`) and
  removing a line via an explicit remove operation. Setting quantity to 0 MUST be rejected
  (removal is a distinct operation, not quantity 0).
- **FR-4 (MUST):** The system MUST return a cart read model with, per line: variant
  identifier, product name, variant name, current unit price cents, quantity, line subtotal
  cents, availability status, hero image reference, and an unavailable flag; and at cart
  level: cart subtotal cents, total line count, currency (ZAR), and any price-updated
  notice indicator. All display facts MUST be resolved from current catalogue data (§
  "Source of truth", §12).
- **FR-5 (MUST):** All monetary values MUST be computed server-side from trusted
  catalogue/variant data at read time; the client MUST NOT supply or influence prices or
  totals.
- **FR-6 (MUST):** The system MUST validate variant existence and `ACTIVE` product status
  when adding; adding an unknown, draft/archived, or unavailable variant MUST be rejected
  with a safe, typed error.
- **FR-7 (MUST):** At read time the system MUST reflect current availability per line and
  MUST **keep and flag** any line whose variant is now unavailable (`OUT_OF_STOCK` or
  otherwise not purchasable). Items MUST NOT be silently removed. The UI MUST clearly
  communicate the unavailable state and provide an explicit removal action.
- **FR-8 (MUST):** The system MUST persist the guest cart across requests/sessions for a
  30-day retention window, and the guest cart cookie lifetime MUST be 30 days, aligned with
  the 30-day retention window. The exact persistence mechanism is a Design decision.
- **FR-9 (SHOULD):** The system SHOULD surface a cart item count for UI display.
- **FR-10 (MUST):** The cart read model MUST be Zod-validated at the application boundary
  before leaving the application layer (consistent with Spec 2 contracts).
- **FR-11 (MUST):** The system MUST provide a dedicated `/cart` page rendering the cart read
  model with accessible view/update/remove interactions.
- **FR-12 (MUST):** Cart mutations MUST be explicit, server-side operations (add / update
  quantity / remove / clear) with well-defined, testable state transitions.
- **FR-13 (MUST):** When the current catalogue price differs from the price at add-time, the
  system MUST use the **current** price and MUST surface, in the cart read model, both a
  **per-line** price-updated indication for each affected line and a **cart-level** summary
  indicator when one or more lines have changed price. The system MUST NOT preserve the old
  price and MUST NOT treat the cart as a price guarantee. Exact UX wording/visual treatment
  is a Design decision.

## 9. Business rules
- **BR-1:** The pricing basis is the **current** trusted variant price at cart-read time;
  the cart MUST NOT trust any client-captured price.
- **BR-2:** Quantities MUST be positive integers within `1..99`; zero/negative/non-integer
  MUST be rejected. Removal is an explicit remove operation.
- **BR-3:** Maximum per-line quantity is 99 (abuse cap and product rule).
- **BR-4:** Adding/holding an item MUST NOT reserve or decrement stock (no inventory
  operations — §11).
- **BR-5:** Currency is ZAR; money is integer cents end to end.
- **BR-6:** The cart is a **purchase intent**, not an order; it confers no guarantee of
  price or availability at checkout.
- **BR-7:** Adding an existing variant increments quantity (capped at 99).

## 10. Data requirements (conceptual only — no schema design here)
- A **Cart** concept: cart identity, guest token/ownership context, lifecycle/retention
  metadata (30-day window), timestamps.
- A **Cart line item** concept: reference to a product variant + quantity. It represents
  **purchase intent**, not catalogue truth.
- Persisted cart state SHOULD primarily represent purchase intent (cart identity, variant
  reference, quantity, token/ownership context, lifecycle/retention metadata) and SHOULD
  avoid unnecessary denormalized catalogue truth.
- Conceptual retention/expiry of guest carts (30 days).
- **Decision 10 (tax):** the cart MUST NOT calculate tax or represent a final
  tax-inclusive payable amount; it MAY expose the **subtotal only**. Tax belongs to a later
  Checkout/Order spec.
- No table/column/index design in this document (that is Design).

### Source-of-truth requirement (strengthened)
- **ST-1 (MUST):** The catalogue remains the single source of truth for current product
  facts. Cart display data — product name, variant name, current price, availability, and
  primary/hero image — MUST be resolved from trusted **current** catalogue data when the
  cart is read.
- **ST-2 (MUST):** The cart MUST NOT become an independent source of truth for catalogue
  facts. Persisted cart state MUST NOT be used to display stale product name/price/
  availability/image in place of current catalogue data.
- **ST-3 (SHOULD):** Persisted cart state SHOULD store only purchase-intent data (identity,
  variant reference, quantity, token/ownership, lifecycle/retention) and avoid unnecessary
  denormalized catalogue fields.

## 11. Commerce / inventory boundary requirements
- **IB-1 (MUST):** Spec 3 MUST NOT introduce operational inventory ownership (no
  reservation, deduction, release, receiving, movements, warehouses). Stock remains
  external and read-only, consumed via the existing `ReadOnlyStockAvailabilityProvider`.
- **IB-2 (MUST):** The cart MUST treat availability as a **point-in-time, advisory** signal:
  validate at add-time, re-check at read time; it does not hold or guarantee stock.
- **IB-3 (MUST):** Behaviour when stock changes between catalogue view and cart action:
  add of a now-unavailable variant MUST be rejected (FR-6); a line that becomes unavailable
  after adding MUST be kept and flagged (FR-7).
- **IB-4 (MUST):** Reservation/deduction semantics and any real inventory system remain the
  responsibility of a later Checkout/Orders/Inventory spec; Spec 3 MUST NOT pre-build them.

## 12. Pricing and money requirements
- **PM-1 (MUST):** All prices and totals MUST be integer ZAR cents, computed server-side.
- **PM-2 (MUST):** Line subtotal MUST equal current unit price × quantity, computed in the
  domain/application layer; no floating point for money.
- **PM-3 (MUST):** The client MUST NOT influence any price, subtotal, or total.
- **PM-4 (MUST):** The cart MUST expose a **subtotal only** (no tax, no final payable). It
  MAY expose clearly-absent/zero display placeholders for future discounts/shipping; no
  computation of those in Spec 3.
- **PM-5 (MUST):** Prices in the cart read model MUST reflect current catalogue prices
  (FR-13); no stale pricing.

## 13. Validation requirements
- **V-1 (MUST):** All cart mutation inputs (variant id, quantity, cart token) MUST be Zod-
  validated at the boundary before use.
- **V-2 (MUST):** Reject: unknown/invalid variant ids; non-integer/zero/negative quantities;
  quantities `> 99`; malformed cart tokens.
- **V-3 (MUST):** Validation failures MUST produce safe, typed, customer-appropriate errors
  that do not leak internal detail.

## 14. Error and edge-case requirements
- **E-1 (MUST):** Adding an unavailable/draft/archived/unknown variant MUST fail gracefully
  with a clear message.
- **E-2 (MUST):** Viewing a cart with a now-unavailable variant MUST render an accessible
  warning state, keep the line, and offer explicit removal (FR-7); it MUST NOT crash or
  silently drop data.
- **E-3 (MUST):** Empty-cart state MUST be handled with an accessible empty state (reuse
  Spec 1 primitives).
- **E-4 (MUST):** Concurrent mutations to the same cart MUST NOT corrupt cart state
  (consistency expectation defined here; strategy is Design).
- **E-5 (MUST):** A price change since add MUST be handled per FR-13 (current price +
  per-line indication + cart-level summary indicator).
- **E-6 (MUST):** An add that would push a line above 99 MUST clamp the resulting quantity
  to 99 (never reject the add) and MUST surface an accessible, non-blocking "maximum
  quantity reached" notice.

## 15. Security requirements
- **S-1 (MUST):** Cart mutations MUST be server-authoritative; the server determines
  identity, price, availability, and totals.
- **S-2 (MUST):** Guest cart tokens MUST be opaque, unguessable, server-issued, and stored
  in a secure, http-only, same-site cookie; a client MUST NOT be able to read/modify
  another cart by guessing tokens.
- **S-3 (MUST):** All boundary inputs MUST be validated (V-1); no trust of client-provided
  price/total/identity.
- **S-4 (MUST):** Cart mutation endpoints/actions MUST have rate limiting/abuse protection
  appropriate to the boundary.
- **S-5 (MUST):** No secrets in client bundles; preserve existing config boundaries; UI MUST
  NOT import Prisma or provider SDKs.

## 16. Accessibility requirements
- **A-1 (MUST):** Cart UI (add, view, update quantity, remove) MUST be fully keyboard
  operable with visible focus and correct semantics.
- **A-2 (MUST):** Quantity controls, add-to-cart, and remove actions MUST have accessible
  names and communicate state changes to assistive tech (e.g., live region for "added to
  cart", updated totals, "price updated", "item unavailable").
- **A-3 (MUST):** Loading, empty, error, and unavailable-item states MUST be accessible
  (reuse Spec 1 state primitives).
- **A-4 (MUST):** Reduced-motion honored for any cart transitions; axe checks in CI; manual
  AT verification in DoD.

## 17. Performance requirements
- **P-1 (MUST):** Cart reads/writes MUST be server-first and efficient; avoid unnecessary
  client JS ("luxury is never slow").
- **P-2 (SHOULD):** Cart read MUST resolve pricing/availability with bounded queries (avoid
  N+1); Spec 1 Core Web Vitals budgets preserved.
- **P-3 (SHOULD):** Cart operations SHOULD feel instant on mobile; optimistic UI MAY be
  used but the server remains authoritative.

## 18. Analytics requirements
- **AN-1 (MUST):** Spec 2's five catalogue events MUST remain unchanged: `product_viewed`,
  `search_performed`, `collection_viewed`, `category_viewed`, `product_relationship_clicked`.
- **AN-2 (MUST):** Spec 3 introduces exactly four new commerce events, and no others:
  `add_to_cart`, `cart_viewed`, `cart_quantity_updated`, `remove_from_cart`.
- **AN-3 (MUST):** All events MUST be emitted only via the existing `AnalyticsProvider`
  boundary using the existing allow-list pattern (enforced by an allow-list + test). No
  other cart analytics events may be emitted.
- **AN-4 (MUST):** Analytics MUST never be treated as transactional truth; the
  database/application remains authoritative for cart state.

## 19. SEO requirements
- **SEO-1 (MUST):** The `/cart` page MUST NOT be indexable (cart is private/transient);
  `robots` MUST disallow the cart route, consistent with existing `/search` handling. No
  other SEO obligations apply to the cart.

## 20. Integration / provider requirements
- **IP-1 (MUST):** Availability MUST be consumed via the existing
  `ReadOnlyStockAvailabilityProvider`; no new inventory provider is introduced.
- **IP-2 (MUST):** No new third-party provider is required for the cart. Payments/shipping
  providers remain out of scope and behind their (future) interfaces.
- **IP-3 (MUST):** Any provider interaction stays behind existing integration boundaries;
  UI/domain remain provider-independent.

## 21. Architecture constraints (mandatory; preserved from Spec 1/2)
- Next.js App Router modular monolith; dependency direction UI → Application → Domain →
  Data/Integration → Providers.
- UI MUST NOT import Prisma or provider SDKs; Prisma confined to `src/data`; domain
  framework/provider-independent; application orchestrates use-cases; domain owns cart
  business rules.
- Zod at boundaries; money in integer ZAR cents.
- No NestJS, no separate backend, no microservices, no unnecessary infrastructure.
- Cart read models follow the Spec 2 pattern (typed, Zod-validated application contracts
  consumed by UI). AI is out of scope in Spec 3.

## 22. Testing requirements
- **T-1 (MUST):** Domain unit tests for cart rules: quantity validation (`1..99`), line
  subtotal/subtotal math (integer cents), add/update/remove/clear transitions, increment-
  on-add + 99 cap, unavailable/invalid variant rejection.
- **T-2 (MUST):** Application tests for cart orchestration resolving availability/pricing
  from trusted sources (stub `ReadOnlyStockAvailabilityProvider` as in Spec 2), including
  current-price-at-read and price-updated notice.
- **T-3 (MUST):** Integration tests (DB-backed, CI `db-verification`) for cart persistence,
  guest token behaviour, 30-day retention semantics, and cart read accuracy against real
  Postgres.
- **T-4 (MUST):** Component/axe tests for cart UI (add/view/update/remove, empty/error/
  unavailable/price-updated states).
- **T-5 (MUST):** E2E journey(s): add to cart from a product → view `/cart` → update
  quantity → remove; unavailable-item keep-and-flag; guest cart persists across navigation.
  Deterministic, using seeded catalogue data.
- **T-6 (MUST):** Architecture boundary tests MUST cover new cart UI/modules (no
  Prisma/provider imports in UI).
- **T-7 (MUST):** Security test proving the server rejects client-tampered price/total/
  quantity/variant input.
- **T-8 (MUST):** Analytics allow-list test proving only the approved event set (five
  catalogue + four cart) can be emitted.

## 23. Observability requirements
- **O-1 (MUST):** Cart mutation failures and validation errors MUST be observable via the
  existing server-side Sentry integration with PII scrubbing (no cart contents/PII leaked).
- **O-2 (SHOULD):** Key cart operations SHOULD be traceable enough to diagnose issues
  without logging sensitive data.

## 24. Migration / backward-compatibility requirements
- **M-1 (MUST):** New persistence MUST be introduced via the normal Prisma migration
  workflow (a new, additive migration; never editing the applied
  `20260918124342_catalogue_init`).
- **M-2 (MUST):** Spec 2 catalogue schema, contracts, availability boundary, and the five
  catalogue analytics events MUST remain intact.
- **M-3 (MUST):** `ProductVariant.stockKey` and the read-only stock boundary remain
  unchanged; the cart references variants by trusted identifier without altering the
  catalogue model (additive relations only, if any).
- **M-4 (MUST):** CI (`secret-scan`, `quality-gates`, `db-verification`) MUST continue to
  pass; new DB-backed tests run in `db-verification`.

## 25. Definition of Done
- All MUST requirements satisfied and tested; every requirement traceable to a test.
- DB-independent gates green: format, lint (incl. boundary rules), strict typecheck,
  unit/component/axe/architecture tests, production build, Storybook build, dependency audit.
- DB-dependent gates green in CI `db-verification`: additive migration deploy, seed, schema
  verify (still no unauthorized inventory tables), cart integration tests, cart E2E.
- Server-authoritative pricing/availability proven by tests (client tampering rejected).
- Source-of-truth preserved: cart display facts resolved from current catalogue; cart not an
  independent catalogue source (ST-1..ST-3).
- Inventory boundary preserved (no reservation/deduction/persistence introduced).
- Cart page non-indexable; accessibility verified (axe + documented manual AT).
- Only the approved event set is emitted (five catalogue + four cart); catalogue events
  unchanged.
- Reviewed against Master Product Brief, Product Principles, UX, Engineering Standards; no
  out-of-scope features.

## 26. Open questions / decisions requiring approval
None. All prior clarifications are LOCKED:
- **Max quantity exceeded:** clamp to 99, never reject, with an accessible non-blocking
  "maximum quantity reached" notice (FR-2, E-6).
- **Guest cart cookie lifetime:** 30 days, aligned with the 30-day retention window (FR-8);
  mechanism remains a Design decision.
- **Price-updated notice:** per-line indication plus a cart-level summary indicator when one
  or more lines changed price (FR-13, E-5); wording/visual treatment remains a Design
  decision.

The Requirements are fully approved and ready for the Design phase (Design not yet
authorized).

---

## Scope boundary (summary)
- **MUST include:** server-authoritative **guest** cart (add/update/remove/clear/view),
  server-computed ZAR-cents pricing from current catalogue, availability validation via the
  existing read-only provider, keep-and-flag unavailable items, current-price + price-updated
  notice, 30-day guest retention, `/cart` page, four approved commerce analytics events,
  validation/error/security/accessibility, additive migration, tests.
- **MAY include:** cart badge; optional drawer/mini-cart (must reuse the same contracts;
  not a domain requirement); display-only discount/shipping placeholders.
- **MUST remain out of scope:** checkout, order creation, payments (PayFast/Payflex/
  PayJustNow), shipping (Bob Go), promotions/promo codes/discounts, gifting/gift messages,
  auth screens/flows, authenticated cart ownership, guest→auth cart merge, operational
  inventory (reservation/deduction/release/warehouses), wishlist, reviews, loyalty,
  referrals, UGC, AI, tax calculation.
