# Spec 3 Design — Shopping Cart (Commerce Foundation, Phase 1)

**Status:** Design — APPROVED / CLOSED. No implementation, migrations, or deps yet.
**Depends on:** Spec 1 (Foundation), Spec 2 (Catalogue). **Requirements:** `requirements.md`
(approved & closed).

This Design translates the approved Requirements into structure only. It preserves every
Spec 1/2 invariant and introduces no out-of-scope capability (no checkout/orders/payments/
shipping/promotions/auth-ownership/operational-inventory/AI/tax).

---

## 0. Layering recap (unchanged)
```
app/ (RSC pages, server actions, route handlers)  →  Application services
Application  →  Domain
Application  →  Data (Prisma repositories) and Integration (providers) via interfaces
Domain       →  pure cart rules (no framework/infra/provider)
Data         →  Prisma → Neon (only place Prisma is imported)
```
New cart code lives under: `src/domain/cart`, `src/application/cart`, `src/data/cart`,
`src/ui/cart`, and cart routes under `app/(store)/cart` + a cart server-action/route module.
UI never imports Prisma or provider SDKs (enforced by existing boundary tests, extended).

---

## 1. Domain model and cart invariants
Pure domain (`src/domain/cart`), framework/provider-independent, no I/O.

**Value objects / types**
- `Quantity` — integer value object enforcing `1..99`. Constructors reject 0/negative/
  non-integer. Provides `increment(by)` that **clamps to 99** and reports whether clamping
  occurred (`{ value: Quantity; clamped: boolean }`).
- `MoneyCents` — integer ZAR cents helper (reuse Spec 1/2 convention; no floats).
- `CartLineIntent` — pure intent record: `{ variantId, quantity }`. Holds **no** catalogue
  facts (name/price/availability/image) — those are derived at read time (source-of-truth).
- `MAX_QUANTITY = 99`, `MIN_QUANTITY = 1` constants.

**Domain operations (pure functions over intent state)** — the add vs. update distinction
is explicit and preserved in the domain API and tests:
- `addLine(lines, variantId, requestedQty)` → **additive**: existing quantity + requested,
  then **clamp the result to 99**, returning `{ lines, clamped: boolean }`. A clamp sets the
  `MAX_QUANTITY_REACHED` notice. `requestedQty` itself must be a positive integer.
- `updateLineQuantity(lines, variantId, qty)` → **set** (absolute): validated `1..99`;
  a direct quantity `> 99` (or `< 1`, non-integer) MUST be **rejected** (not clamped) as
  `InvalidQuantity`. This is not a remove.
- `removeLine(lines, variantId)` → explicit removal.
- `clear(lines)` → empty.
- `computeLineSubtotal(unitPriceCents, quantity)` and `computeSubtotal(pricedLines)` — pure
  integer math. (Prices are injected from the application layer at read time; the domain
  never fetches them.)

Distinction summary: **add clamps** (never rejects on the 99 cap, surfaces a notice);
**update rejects** any direct value outside `1..99`.

**Cart invariants (enforced in domain)**
- Every line quantity ∈ `1..99`; no zero/negative lines.
- At most one line per `variantId` (adding an existing variant merges/increments).
- Money math is integer-cents only; `lineSubtotal = unitPrice × quantity`.
- The domain computes totals from **injected** current prices; it never stores or trusts a
  captured price.

Assumption: line identity is `variantId` (a variant already encodes product+options), which
matches the Spec 2 catalogue model.

---

## 2. Application services / use cases
`src/application/cart` orchestrates use-cases; depends on Domain, the cart repository
(Data), the catalogue read path (Spec 2), the read-only stock provider (Spec 2 port), and
the analytics boundary. Exposes a `CartService` with explicit operations:

- `getOrCreateCart(ctx)` → resolves the guest cart by token (creates one if absent).
- `addItem(ctx, { variantId, quantity })` → validates variant is `ACTIVE` + purchasable,
  applies domain `addLine` (clamp-to-99), persists intent, returns the fresh **read model**.
- `updateItemQuantity(ctx, { variantId, quantity })` → domain `updateLineQuantity`, persist,
  return read model.
- `removeItem(ctx, { variantId })` → domain `removeLine`, persist, return read model.
- `clearCart(ctx)` → persist empty, return read model.
- `getCart(ctx)` → **read-through**: load persisted intent, resolve current catalogue facts +
  availability + prices, compute totals, build validated read model.

Responsibilities that live in Application (not Domain, not Data):
- Authorization/identity (guest token resolution) and cookie orchestration boundary.
- Fetching **current** catalogue facts and availability (via Spec 2 catalogue read path +
  `ReadOnlyStockAvailabilityProvider`) and injecting current prices into domain math.
- Zod validation of inputs and of the outgoing read model.
- Emitting the approved analytics events.
- Mapping domain/validation failures into the typed error model.

The Application layer is the ONLY place that combines persisted intent with live catalogue
truth. Domain stays pure; Data stays persistence-only.

---

## 3. Data / repository design
`src/data/cart/cart-repository.ts` — the only place Prisma touches the cart. Returns plain
row shapes (mirroring the Spec 2 `catalogue-repository` pattern); never leaks Prisma types
upward.

**Persisted (intent only — see §7):**
- `Cart`: `id`, `token` (opaque guest token, unique), `createdAt`, `updatedAt`,
  `expiresAt` (retention horizon). **No lifecycle status field** — the Requirements only
  need identity, timestamps, and `expiresAt`; conceptual states (ACTIVE/ABANDONED/CONVERTED)
  are intentionally NOT introduced (kept minimal, no scope expansion).
- `CartItem`: `id`, `cartId`, `variantId` (FK → `ProductVariant`, `onDelete: Restrict`),
  `quantity` (int), `lastPresentedPriceCents` (int, nullable — **non-authoritative**
  change-detection reference only, per §8), `createdAt`, `updatedAt`. Unique
  `(cartId, variantId)` enforces one-line-per-variant.

**NOT persisted as truth:** product/variant name, current price, availability, image
(all resolved from current catalogue at read time). `lastPresentedPriceCents` is the only
price-shaped value stored and it is explicitly non-authoritative — it is never used to
compute or display price/subtotal/availability/payable (prevents a second source of
catalogue truth).

Repository methods (illustrative): `findByToken`, `create`, `upsertItem`,
`setItemQuantity`, `deleteItem`, `deleteAllItems`, `touch(expiresAt)`, `listItems(cartId)`.

`variantId` is an additive FK to the existing `ProductVariant`; no catalogue columns change
(M-3).

**Variant-deletion behaviour (LOCKED):** `CartItem.variant` uses **non-cascading**
deletion — `onDelete: Restrict`. `CartItem` MUST NOT be cascade-deleted when a
`ProductVariant` is deleted, because that would silently remove customer cart intent. If a
referenced variant/product can no longer be resolved (deleted, or no longer `ACTIVE`), the
cart read path MUST **retain the cart line and mark it `unavailable`** (FR-7) — never drop
it. Read-time resolution therefore tolerates a missing/inactive variant regardless of any
future catalogue change.

---

## 4. Guest cart token and cookie strategy
- On first cart mutation (or first `getOrCreateCart`), the server issues an **opaque,
  unguessable** token (e.g. 128-bit random, base64url) — server-generated only.
- Stored in a cookie: **http-only, Secure, SameSite=Lax**, path `/`, **max-age 30 days**.
- The cookie holds only the token; the cart lives server-side keyed by token hash/value.
- The token is never derived from user input; a client cannot read another cart by guessing
  (S-2). No PII in the cookie.
- Reading the token: server components/actions read the request cookie; the Application
  layer receives it via the request context, not the UI.

Cookie read/write mechanism (Next cookies API vs. response headers) is an implementation
detail deferred to Tasks; the contract is: Application requests "resolve/issue token", the
app/route layer performs the actual cookie I/O.

---

## 5. Cart persistence and 30-day retention strategy (LOCKED)
- Retention is a **30-day sliding window**. `Cart.expiresAt = now + 30 days`.
- **Relevant cart activity refreshes `expiresAt`** to `now + 30 days`. Relevant activity =
  cart mutations (add/update/remove/clear) and cart reads/presentations (`getCart`). Each
  such activity also refreshes the cookie so its **max-age is 30 days**, kept consistent
  with `expiresAt`.
- **Expired carts are treated as absent:** a read/mutation on an expired (or unknown) token
  yields an empty cart, and a fresh token/cart MAY be issued on the next mutation.
- Cleanup of expired rows is opportunistic/hygiene only (e.g. delete `expiresAt < now` when
  encountered or via a simple maintenance query); it MUST be non-destructive to non-expired
  carts. **No cron infrastructure is required** by this Design (mechanism detail deferred to
  Tasks).

---

## 6. Concurrency / consistency strategy (LOCKED)
- Each mutation is a single DB transaction scoped to one cart (`cartId`); a cart never ends
  in a partial state (E-4).
- One-line-per-variant is enforced by the unique `(cartId, variantId)` constraint.
- **Add-to-cart MUST be concurrency-safe and MUST NOT rely on a plain app-level
  read→calculate→write.** Concurrent adds of the same variant MUST NOT lose updates. The
  effective operation is a single atomic mutation equivalent to:
  `newQuantity = min(currentQuantity + requestedQuantity, 99)`.
  **Chosen mechanism (Design level):** a single atomic upsert executed in the database:
  - insert the line with `quantity = min(requestedQuantity, 99)` **on conflict**
    `(cartId, variantId)` do update set
    `quantity = LEAST("CartItem".quantity + EXCLUDED.quantity, 99)`.
  This is one statement (atomic under the row lock taken by the upsert/conflict path), so
  two concurrent adds serialize and neither is lost; the 99 clamp is applied atomically in
  the same statement. The domain still owns the *rule* (`min(current + requested, 99)` and
  the clamped-notice semantics); the Data layer implements it as one atomic DB operation
  rather than a separate read and write. Whether the returned row indicates clamping (e.g.
  comparing requested vs. applied delta) is computed to drive the `MAX_QUANTITY_REACHED`
  notice.
  - `updateItemQuantity` is a **set** (not additive): it validates `1..99` first (reject
    `>99`, see §Quantity semantics) and writes the exact value in the transaction — no
    additive race applies.
- Cross-cart concurrency is irrelevant (carts isolated by token).
- The cart holds **no** stock; no reservation, so no inventory race to manage (IB-1/IB-2).
  Availability is advisory at read time.
- Transaction/atomic-statement boundary lives in the Data layer; Application composes;
  Domain remains pure.

---

## 7. Catalogue read-through / source-of-truth strategy
- Persisted cart = **intent** (`variantId` + `quantity`) only (ST-1..ST-3).
- On every `getCart`/mutation-returning-read-model, the Application layer:
  1. Loads persisted items (Data).
  2. Resolves **current** catalogue facts for those `variantId`s via the Spec 2 catalogue
     read path (product name, variant name, unit price, hero image) — the catalogue remains
     the single source of truth.
  3. Resolves **current** availability via `ReadOnlyStockAvailabilityProvider`.
  4. Computes prices/subtotals in the domain from current prices.
- If a variant no longer exists / product not `ACTIVE`: the line is **kept and flagged
  unavailable** (never silently dropped, FR-7); it contributes to display but is marked and
  offered explicit removal. (This is why `CartItem.variant` deletion handling matters — see
  Risks; read-time resolution must tolerate a missing/inactive variant regardless of FK
  choice.)

A dedicated cart catalogue-read helper will fetch the minimal current facts for a set of
`variantId`s (bounded query, no N+1 — P-2), reusing Spec 2 data/application code rather than
duplicating catalogue logic.

---

## 8. Pricing and availability resolution
- **Price:** always the current `ProductVariant.priceCents` at read time (integer ZAR cents).
  The domain multiplies by quantity; subtotal is the integer sum. No client price accepted
  (PM-1..PM-3).
- **Price-updated indication (LOCKED):** change detection uses a **non-authoritative**
  persisted reference on `CartItem` named **`lastPresentedPriceCents`**. Rules:
  - `ProductVariant.priceCents` remains the **sole authoritative current price**. It is the
    only value ever used for line price, line subtotal, cart subtotal, availability, and any
    payable/displayed amount.
  - `lastPresentedPriceCents` MUST **never** be used to calculate price, subtotal,
    availability, or any payable amount. It exists **only** for change detection and is not a
    second source of catalogue truth. (A test asserts it never feeds pricing/display.)
  - **When it is created/updated:** it records the unit price that was last **presented to
    the customer for that line**. It is set when a line is created (`addItem` — to the
    current authoritative price at that moment) and refreshed to the current authoritative
    price whenever the cart is **read/presented** (`getCart`, and the read model returned by
    mutations) *after* `priceUpdated` for that read has been computed.
  - **When `priceUpdated` is true/false:** during a read, for each line compute
    `priceUpdated = (lastPresentedPriceCents !== null && lastPresentedPriceCents !== currentPriceCents)`.
    After computing the read model, `lastPresentedPriceCents` is updated to
    `currentPriceCents` so the indicator is shown **once** per change and clears on the next
    presentation (unless the price changes again). On line creation, `priceUpdated = false`.
  - Read model exposes per-line `priceUpdated: boolean` and cart-level
    `anyPriceUpdated: boolean` (FR-13). FR-13 is unchanged; this is a Design clarification.
- **Availability:** current status per line from the read-only provider (`IN_STOCK`/
  `LOW_STOCK`/`OUT_OF_STOCK`); lines that are `OUT_OF_STOCK`/inactive are flagged
  `unavailable: true`. Availability never mutates stock.

---

## 9. API / server-action / application contracts
UI invokes **server actions** (preferred for mutations in App Router) and/or a thin route
handler; both call `CartService` — neither touches Prisma/providers (INV). Contracts:

- `addItem(input: { variantId: string; quantity: number }) → CartReadModel`
- `updateItemQuantity(input: { variantId: string; quantity: number }) → CartReadModel`
- `removeItem(input: { variantId: string }) → CartReadModel`
- `clearCart() → CartReadModel`
- `getCart() → CartReadModel`

All inputs Zod-validated at the boundary (V-1). All return the validated `CartReadModel`
(or a typed error, §11). Rate limiting wraps the mutation entrypoints (§12). Cookie
issue/refresh happens in the action/route layer around the service call.

SEO note: `/cart` is a page route; mutations are actions/handlers, not indexable content.

---

## 10. Read models and Zod schemas
`src/application/cart/read-models.ts` (mirrors Spec 2 pattern; Zod-validated at boundary):

```
CartLineReadModel = {
  variantId, productSlug, productName, variantName,
  unitPriceCents (int ≥ 0), quantity (1..99),
  lineSubtotalCents (int ≥ 0),
  availability: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK",
  unavailable: boolean,          // kept-and-flagged
  priceUpdated: boolean,         // per-line indicator (FR-13)
  heroImage: { mediaRef, alt } | null,
}

CartReadModel = {
  cartId,
  currency: "ZAR",
  lines: CartLineReadModel[],
  itemCount: int,                // sum of quantities (FR-9)
  subtotalCents: int ≥ 0,        // subtotal ONLY (no tax/shipping/discount) — PM-4
  anyPriceUpdated: boolean,      // cart-level summary indicator (FR-13)
  notices: CartNotice[],         // e.g. { type: "MAX_QUANTITY_REACHED", variantId } (FR-2/E-6)
}
```
Image URL resolution goes through the existing `MediaProvider` view-mapper (as in Spec 2)
in the application/view layer, not the UI. Read models expose `mediaRef`+`alt`; a mapper
produces the URL for the UI.

---

## 11. Error model
Typed, safe, customer-appropriate errors (V-3, E-1); no internal leakage:
- `VariantNotFound` / `VariantNotPurchasable` (unknown, draft/archived, or unavailable at
  add-time) → add rejected with a clear message.
- `InvalidQuantity` (not integer, `<1`, or `>99` on a direct set) → rejected.
- `InvalidCartToken` (malformed) → treated as no cart / reissue.
- `CartNotFound`/expired → resolves to an empty cart rather than an error where appropriate.
Non-error **notices** (not failures) travel in the read model: `MAX_QUANTITY_REACHED`
(clamp), `PRICE_UPDATED` (per-line + cart-level). Errors are represented as a typed result
(discriminated union or thrown typed error caught at the action boundary) — consistent with
Spec 2 conventions; final shape is a small implementation choice.

---

## 12. Security / rate-limiting approach
- Server-authoritative everything: identity (token), price, availability, totals (S-1, PM-3).
- Opaque http-only/Secure/SameSite=Lax cookie; unguessable token (S-2). No cross-cart access.
- Zod validation at every boundary; reject tampered variantId/quantity/token (S-3, V-2).
- Rate limiting on mutation entrypoints (add/update/remove/clear) — per-token + per-IP
  sliding window; abusive requests rejected (S-4). Mechanism reuses/extends the app's
  existing rate-limit approach; no new infra beyond what Foundation allows.
- No secrets in client bundles; UI never imports Prisma/providers (S-5).

---

## 13. UI / component architecture for /cart and add-to-cart
`src/ui/cart` (catalogue-scoped-style, token-driven, no data/provider access; server-first):
- `AddToCartButton` (client component): calls the `addItem` server action; announces result
  via a live region; shows the `MAX_QUANTITY_REACHED` notice accessibly. Integrated on the
  product detail page (Spec 2) via the existing variant selector.
- `/cart` page (`app/(store)/cart/page.tsx`, Server Component): renders `CartReadModel`.
- `CartLineItem` (client where interactivity needed): quantity control (stepper/select),
  explicit Remove action, unavailable flag, per-line price-updated indicator.
- `CartSummary`: subtotal, item count, cart-level price-updated indicator, empty state.
- Reuse Spec 1 primitives (Button, state patterns, Price) and Spec 2 view-mapper for images.
- Optional mini-cart/drawer is NOT built here; if added later it consumes the same
  `CartReadModel`/actions (no domain requirement).

Client vs server: page and summary are server-rendered; only the interactive controls are
client components (P-1, minimal client JS).

---

## 14. Accessibility approach
- All controls keyboard operable, visible focus, correct roles/labels (A-1, A-2).
- Live-region announcements for: added to cart, quantity updated, removed, max-quantity
  reached, price updated, item unavailable (A-2).
- Accessible empty/error/unavailable/loading states via Spec 1 primitives (A-3).
- Reduced-motion honored; axe in CI; manual AT verification in DoD (A-4).
- Quantity control exposes min/max and current value to assistive tech.

---

## 15. Analytics integration
- Extend the existing `AnalyticsProvider` allow-list with exactly four cart events:
  `add_to_cart`, `cart_viewed`, `cart_quantity_updated`, `remove_from_cart` (AN-2). The five
  Spec 2 catalogue events are unchanged (AN-1).
- Typed event payloads (e.g. `add_to_cart: { variantId, quantity }`,
  `cart_quantity_updated: { variantId, quantity }`, `remove_from_cart: { variantId }`,
  `cart_viewed: { itemCount, subtotalCents }`) — no PII, no price tampering surface.
- Emission only via the Application layer through the provider boundary; allow-list guard +
  test proves no other event can be emitted (AN-3). Analytics is never transactional truth
  (AN-4).
- Implementation choice: extend the current single allow-list, or add a parallel
  `commerce-events` module that shares the same guard pattern — decided in Tasks; either way
  the union of emittable events is exactly nine.

---

## 16. SEO handling for /cart
- `/cart` MUST be non-indexable: add `robots: { index: false }` on the route metadata AND
  ensure `robots.txt` disallows `/cart` (extend the existing rule that already disallows
  `/search`) — SEO-1.
- No canonical/JSON-LD/sitemap entries for the cart (private/transient).

---

## 17. Testing architecture
- **Domain unit (DB-free):** Quantity (`1..99`, reject 0/neg/non-int), increment+clamp-to-99
  with `clamped` flag, add/update/remove/clear transitions, integer-cents subtotal math,
  one-line-per-variant. (T-1)
- **Application (DB-free, stubs):** orchestration with stub `ReadOnlyStockAvailabilityProvider`
  and stub catalogue read; current-price-at-read; price-updated per-line + cart-level;
  keep-and-flag unavailable; read-model Zod validation. (T-2)
- **Integration (DB-backed, CI `db-verification`):** persistence, token behaviour, 30-day
  retention/expiry semantics, unique `(cartId, variantId)`, read accuracy vs. real Postgres.
  (T-3)
- **Component/axe (DB-free):** AddToCartButton, CartLineItem, CartSummary, empty/error/
  unavailable/price-updated states. (T-4)
- **E2E (CI, seeded data):** add from product → `/cart` → update qty → remove; unavailable
  keep-and-flag; guest cart persists across navigation; clamp-to-99 notice. (T-5)
- **Architecture boundary:** new cart UI cannot import Prisma/providers; Prisma only in
  `src/data/cart`. (T-6)
- **Security:** server rejects tampered price/total/quantity/variant; cannot access another
  cart via forged token. (T-7)
- **Analytics allow-list:** only the nine approved events emittable. (T-8)
Integration/E2E live under `tests/integration` and `tests/e2e` (existing split; DB-free
suite stays green without a DB).

---

## 18. Migration strategy
- One **additive** Prisma migration adding `Cart` and `CartItem` (+ FK to `ProductVariant`,
  unique `(cartId, variantId)`, index on `Cart.token`, index on `Cart.expiresAt`). Generated
  via the normal `prisma migrate` workflow; **UTF-8 without BOM** (lesson from Spec 2);
  applied via `prisma migrate deploy` in CI. Never edits `20260918124342_catalogue_init`
  (M-1). No catalogue columns change (M-3). No availability/inventory tables (IB-1) — the
  schema-verify script's forbidden-table check still passes.
- `db:verify` MAY be extended to assert the new cart tables/constraints exist (optional,
  decided in Tasks); it MUST continue to assert no inventory/availability tables.

---

## 19. CI integration
- No new jobs. `quality-gates` runs the DB-free cart tests (domain/application/component/
  arch/analytics). `db-verification` runs the additive migration deploy → seed → schema
  verify → cart integration tests → cart E2E, against the Neon dev branch (secret-only
  `DATABASE_URL`, no destructive resets). `secret-scan` unchanged.
- Dependency audit: no new runtime dependency is anticipated (cart uses existing stack);
  if a rate-limit helper is needed, it will be evaluated in Tasks against the audit gate.

---

## 20. Observability / Sentry integration
- Cart mutation failures and validation errors reported via the existing **server-side**
  Sentry integration with PII scrubbing; cart contents/PII never logged (O-1).
- Errors flow through the typed error model; only safe, non-sensitive context is attached
  (e.g. operation name, error code — never token value or customer data) (O-2).

---

## What is persisted vs derived
- **Persisted (intent):** `Cart(id, token, createdAt, updatedAt, expiresAt)` — no lifecycle
  status field; `CartItem(id, cartId, variantId, quantity, createdAt, updatedAt,
  lastPresentedPriceCents)` where `lastPresentedPriceCents` is a **non-authoritative**
  change-detection reference only (never used for pricing/subtotal/availability/display).
- **Derived at read time:** product/variant names, current unit price, line subtotal,
  cart subtotal, item count, availability status, `unavailable`/`priceUpdated`/
  `anyPriceUpdated`, hero image URL, notices.

## Domain vs Application vs Data
- **Domain:** quantity/clamp/increment rules, line-set operations, integer-cents math,
  invariants. No I/O, no catalogue/price fetching.
- **Application:** token/identity, catalogue read-through + availability resolution, price
  injection, Zod validation, analytics emission, error mapping, transaction composition.
- **Data:** Prisma cart repository + transaction execution; plain row shapes; no upward
  Prisma leakage.

## Transaction / concurrency boundaries
- One transaction per mutation, scoped to a single `cartId`; unique `(cartId, variantId)`
  prevents duplicate lines. Add-to-cart uses a single atomic database upsert applying
  `LEAST(currentQuantity + requestedQuantity, 99)`. It does not perform an application-level
  read-modify-write. The database operation is concurrency-safe and prevents lost updates.
  No stock reservation → no inventory race.

## Assumptions (all resolved / locked)
- A1 (LOCKED): Line identity = `variantId` (variant encodes product + options).
- A2 (LOCKED): 30-day retention is a **sliding** window refreshed on cart activity, aligned
  to a 30-day cookie max-age; expired carts treated as absent; no cron required (§5).
- A3 (LOCKED): Price-change detection uses the non-authoritative `lastPresentedPriceCents`
  on `CartItem`; authoritative price is always `ProductVariant.priceCents`; the reference is
  never used for pricing/display; creation/update timing defined in §8.
- A4 (assumption, standing): A lightweight rate-limit mechanism consistent with Foundation
  is acceptable without new infrastructure (mechanism chosen in Tasks; §12).

## Risks / trade-offs (resolved where flagged)
- R1 (price-updated detection) — RESOLVED: `lastPresentedPriceCents` is the single,
  clearly non-authoritative change-detection reference; a test asserts it never drives
  pricing/subtotal/availability/display. No second source of catalogue truth (§8).
- R2 (variant deletion/inactivation) — RESOLVED: `CartItem.variant` uses `onDelete: Restrict`
  (non-cascading); if a variant/product can't be resolved, the line is kept and flagged
  `unavailable` (FR-7). Read-time resolution tolerates missing/inactive variants (§3, §7).
- R3 (expiry cleanup) — RESOLVED: opportunistic/hygiene deletion of `expiresAt < now`, must
  be non-destructive to live carts; no cron infrastructure required (§5).
- R4 (guest-only): merge on future login is out of scope; the token model lets a later
  Accounts/Checkout spec associate a cart without redesign.
- R5 (concurrency) — RESOLVED: add-to-cart is a single atomic DB upsert applying
  `LEAST(current + requested, 99)` on conflict, so concurrent adds cannot lose updates (§6).

---

## Design Review Checklist
- [ ] Layering preserved: UI → Application → Domain → Data/Integration → Providers; UI imports no Prisma/provider SDK.
- [ ] Catalogue remains source of truth; cart persists intent only (ST-1..ST-3); display facts derived at read time.
- [ ] Server-authoritative pricing/availability; no client price/total trust; integer ZAR cents throughout.
- [ ] Guest-only; opaque http-only/Secure/SameSite cookie; 30-day cookie + retention aligned.
- [ ] Quantity semantics explicit: `addLine` is additive + clamps to 99 (notice); `updateLineQuantity` is an absolute set that rejects `>99` / `<1` / non-integer.
- [ ] Add-to-cart is concurrency-safe via a single atomic DB upsert (`LEAST(current + requested, 99)`); no lost updates.
- [ ] Unavailable existing lines kept-and-flagged with explicit remove; never silently dropped; `CartItem.variant` is `onDelete: Restrict` (non-cascading).
- [ ] Price changes use current authoritative `ProductVariant.priceCents`; `lastPresentedPriceCents` is non-authoritative, never used for pricing/display, with defined create/update timing; per-line + cart-level indicators; no price guarantee.
- [ ] Persistence minimal: `Cart(id, token, createdAt, updatedAt, expiresAt)` with NO lifecycle status; `CartItem(..., quantity, lastPresentedPriceCents)`.
- [ ] Retention is a 30-day sliding window refreshed on activity; cookie max-age 30 days; expired carts absent; no cron required.
- [ ] Tax/discount/shipping excluded; subtotal only.
- [ ] Exactly nine emittable analytics events (5 catalogue + 4 cart) via the allow-list boundary.
- [ ] No operational inventory (no reservation/deduction/release/warehouses); availability via existing read-only provider.
- [ ] Additive migration only (UTF-8 no BOM); catalogue schema and `stockKey` untouched; no forbidden inventory tables.
- [ ] `/cart` non-indexable (metadata + robots).
- [ ] Accessibility (keyboard, focus, live regions, reduced motion, axe) covered.
- [ ] Testing across domain/application/integration/component-axe/e2e/architecture/security/analytics.
- [ ] CI: quality-gates (DB-free) + db-verification (DB-backed) with secret-only DATABASE_URL, no destructive resets.
- [ ] Observability via server-side Sentry with PII scrubbing.
- [ ] Assumptions A1–A3 and risks R1–R3, R5 are LOCKED in this Design; A4 (rate-limit mechanism) is the only standing implementation choice, deferred to Tasks.
