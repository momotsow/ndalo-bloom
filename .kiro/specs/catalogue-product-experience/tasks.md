# Catalogue & Product Experience — Tasks

**Spec:** catalogue-product-experience (Spec 2)
**Status:** Not started. Do not implement until approved.

## Scope guard (applies to every task)
Preserve the approved Next.js modular monolith (`UI → Application → Domain →
Data/Integration → Providers`). No NestJS/second backend/microservices. UI never imports
Prisma/provider SDKs. Do NOT build: cart, checkout, payments, PayFast/Payflex/PayJustNow,
shipping/Bob Go, orders/order management, wishlist, reviews, promotions, inventory
management/operations, customer accounts, auth screens/flows, any AI (Bloom AI, Gift
Finder, AI search/recommendations/gift messages, Bloom Intelligence, AI Store Manager),
rituals, UGC, loyalty, referrals, ML/vector/embeddings. AI-readiness only shapes
interface/contract design.

## Tasks

- [ ] 1. Catalogue Prisma schema + migration (Neon)
  - Product, ProductVariant, Category (self-relation), Collection (M:N), ProductImage
    (product-owned, required alt, role), Ingredient/Benefit/Scent (M:N), Mood (M:N),
    Occasion (M:N), ProductRelationship (typed, no mood/occasion strings). Money as
    integer cents. Seed the 5 categories.
  - Owns its migration. Remove/replace the Foundation infrastructure-only `HealthCheck`
    model per its documented note. NO Availability/inventory table and NO
    inventory-operation tables — availability is derived at read time (see Task 3/§7).
  - _Requirements: FR-1..FR-9, FR-7a, FR-7b, FR-8a_

- [ ] 2. Data-layer repositories + read-only stock availability provider
  - Prisma-only repositories for products, variants, categories, collections, images,
    ingredient/benefit/scent, mood/occasion, relationships, search. Map rows → read
    models; no Prisma types leak upward; no Prisma outside src/data.
  - Define an abstract read-only stock/availability dependency
    (`ReadOnlyStockAvailabilityProvider`, name may differ) behind an interface; provide a
    deterministic development/seed implementation. No persistent inventory quantities.
  - _Requirements: FR-10, FR-8, FR-8b, FR-8c, INV-3_

- [ ] 3. Application catalogue contracts + availability derivation
  - CatalogueService / ProductQueryService returning Zod-validated typed read models.
    ProductReadModel exposes moods[] and occasions[] as structured collections.
  - Derive AvailabilityStatus (IN_STOCK/LOW_STOCK/OUT_OF_STOCK) at read time from the
    read-only provider using the configurable low-stock threshold (default ≤5). Represent
    it as a domain enum/value object + read-model field, never a table.
  - _Requirements: FR-10, FR-11, FR-7c, FR-8, FR-8a, AIR-2, AIR-3_

- [ ] 4. SearchService (V1 Postgres) with effective configurable weighting
  - StructuredQuery input (text, filters, sort, pagination); Postgres FTS + pg_trgm impl.
    SearchWeighting value-object with actual numeric weights (default name:4 > scent:3 >
    benefit:2 > description:1) that the Postgres relevance calculation ACTUALLY applies
    (e.g. setweight/ts_rank); not nominal. Changing weights requires no SearchService
    rewrite. Empty/failure handling. Contract accommodates future NL/AI mapping.
  - _Requirements: FR-18, FR-19, FR-19a, FR-20_

- [ ] 5. RecommendationService (rule-based)
  - Deterministic strategy (relationships → category → scent → mood → collections) with
    explainable reasons. Interface allows future strategies. No ML/vectors.
  - _Requirements: FR-21, FR-22_

- [ ] 6. Catalogue components (catalogue-scoped, token-driven)
  - Product card, image gallery, variant selector, ingredient/benefit/scent presentation,
    mood/occasion display, availability badge (IN_STOCK/LOW_STOCK/OUT_OF_STOCK), related-
    products module. No data access or provider code in components. Accessible by default.
  - _Requirements: FR-14, FR-16, FR-25, FR-8_

- [ ] 7. Shop, category & collection experiences
  - /shop (server-side pagination + progressive "Load More"), /categories/[slug],
    /collections/[slug] as Server Components with editorial layout and loading/empty/error
    states. All product links resolve to canonical /products/[slug].
  - _Requirements: FR-12, FR-13, FR-16, FR-17, FR-17a_

- [ ] 8. Product detail experience
  - /products/[slug] (canonical): editorial-first hierarchy → gallery → price/variants →
    ingredients/benefits/scent → mood/occasion → availability → related/complementary.
  - _Requirements: FR-14, FR-15, FR-17, FR-17a_

- [ ] 9. Search & filtering UI
  - Accessible search input, category/collection filters, price filter, sorting
    (relevance, newest, price asc, price desc), empty results, failure state. Server-first.
  - _Requirements: FR-18, FR-19, FR-25_

- [ ] 10. SEO
  - Per-product/collection metadata, canonical URLs (always /products/[slug]), breadcrumbs,
    Product + BreadcrumbList JSON-LD, sitemap entries, Open Graph/Twitter cards via
    MediaProvider.
  - _Requirements: FR-23, FR-17a_

- [ ] 11. Analytics event contract (Spec-2-limited)
  - Typed event definitions via AnalyticsProvider; emit ONLY product_viewed,
    search_performed, collection_viewed, category_viewed, product_relationship_clicked.
    Document (do not emit) future event categories.
  - _Requirements: FR-26_

- [ ] 12. Performance
  - Server Components, caching/revalidation for catalogue pages, Cloudinary responsive
    images, minimal client bundles; verify against Core Web Vitals budgets.
  - _Requirements: FR-24, NFR-2_

- [ ] 13. Accessibility
  - Keyboard, semantic/heading hierarchy, meaningful alt, accessible gallery/filter
    controls, focus, SR-friendly states, reduced motion. axe in CI + documented manual AT.
  - _Requirements: FR-25, NFR-3_

- [ ] 14. Seed content (temporary, non-production)
  - Development/test/Storybook/preview seed data + placeholder Cloudinary imagery, clearly
    marked temporary and NOT production-approved. No dependency on placeholders being
    production-suitable.
  - _Requirements: FR-27_

- [ ] 15. Tests
  - Unit: domain rules, recommendation strategy, search query building + that Postgres
    ranking actually reflects SearchWeighting, availability derivation from the read-only
    provider (incl. threshold boundary at ≤5), moods/occasions in read model, read-model
    validation. Component/axe: catalogue components + pages. Extend architecture tests to
    forbid Prisma/provider imports in new catalogue UI. E2E (Playwright): shop → product →
    related; search → results/empty; canonical URL.
  - _Requirements: all; DoD_

## Definition of Done
- All requirements satisfied; acceptance criteria pass.
- format, lint (incl. boundary rules), strict typecheck, unit/component/architecture/axe
  tests, production build, Storybook build, secret scan, dependency audit — all green.
- Architecture boundary tests still reject prohibited imports (incl. new catalogue UI).
- Catalogue read models are the trusted source; inventory is read-only; no AI/client
  asserts commerce facts.
- No Availability/inventory table exists; AvailabilityStatus is derived at read time via
  the read-only stock provider. ProductReadModel exposes moods[]/occasions[] directly.
  SearchWeighting numeric weights are actually applied by the Postgres ranking (verified
  by tests), not nominal.
- Canonical product URL is /products/[slug] everywhere; SEO validated (metadata,
  canonical, JSON-LD, sitemap, OG).
- Only the five catalogue/search analytics events are emitted.
- Performance within CWV budgets; accessibility automated + documented manual AT for
  interactive surfaces.
- Seed content clearly marked temporary/non-production.
- Reviewed against the Master Product Brief and steering. No out-of-scope features added.

## Locked Human Decisions
1. Low-stock threshold: configurable, default `LOW_STOCK <= 5`.
2. Catalogue pagination: server-side pagination with progressive "Load More".
3. Sorting: relevance, newest, price ascending, price descending.
4. Product URL: `/products/[slug]` (only canonical).
5. Analytics: only catalogue/search events emitted in Spec 2.
6. Search: configurable weighting, default name > scent > benefit > description.
7. Seed content: temporary development/preview/test content only.

(Do not reopen unless a genuine architectural contradiction arises.)

## Risks / Trade-offs
- **R-1 Over-engineering for future AI** (med/med): build only catalogue contracts + typed
  events + Mood/Occasion reference data; create no AI services now.
- **R-2 Inventory boundary leakage** (med/med): availability is derived/read-only; all
  stock operations deferred to a later Spec.
- **R-3 Postgres FTS relevance quality** (med/med): configurable weighting value-object;
  SearchService boundary allows a dedicated engine later without consumer changes.
- **R-4 Image performance/cost via Cloudinary** (med/med): responsive transforms, correct
  sizes, caching; all media behind MediaProvider; product-owned images keep the model
  simple.
- **R-5 SEO correctness (canonical/JSON-LD)** (med/high): single canonical URL + validate
  structured data before launch readiness.
- **R-6 Analytics contract churn** (low/med): define broad typed schema now, emit only
  Spec-2 events, so future BI/AI events extend rather than replace.
- **Trade-off:** product-owned images now means adding variant imagery later requires a
  small model change — accepted to avoid premature complexity (documented in design §8).

## Roadmap (corrected 8-phase; quality continuous)
1. Foundation & Design System
2. Catalogue & Product Experience (this Spec)
3. Commerce — Cart, Checkout, Payments, Shipping, Orders
4. Customer & Admin — Accounts, Order history, Admin, Inventory management, Promotions,
   Reviews
5. AI & Discovery — Bloom AI, Gift Finder, Natural-language search, AI recommendations,
   AI gift messages
6. Launch Readiness — integrated QA, SEO, performance, security, accessibility,
   monitoring, analytics, payment readiness, shipping readiness
7. Bloom Intelligence / AI Store Operations
8. Growth & Advanced AI
