# Catalogue & Product Experience — Design

**Spec:** catalogue-product-experience (Spec 2)
**Status:** Revised — awaiting review. No implementation.

## 1. Architecture (unchanged monolith)

```
UI / app (RSC pages, route handlers)  ──► Application services
Application ──► Domain
Application ──► Data (Prisma repositories) and Integration (MediaProvider, AnalyticsProvider)
Domain ──► pure catalogue rules (no framework/infra/provider, no AI)
Data / Integration interfaces ──► Infrastructure / Providers (Prisma → Neon, Cloudinary, PostHog)
```

No NestJS. No separate backend. No microservices. UI/app calls application services only.
The catalogue domain contains no AI logic and no Prisma. Cloudinary is used only through
the existing `MediaProvider` integration boundary.

## 2. Catalogue domain model (conceptual — Prisma schema authored in tasks)

Money in integer ZAR cents. Slugs are stable and SEO-friendly.

- **Product** — id, slug, name, story/description, status(`draft`/`active`/`archived`),
  categoryId, seo fields (title, description), createdAt/updatedAt. **Owns its images.**
- **ProductVariant** — id, productId, name (size/scent label), sku, price(cents),
  availability (read-only, derived), position. **No variant-specific images in V1.**
- **Category** — id, slug, name, parentId (self-relation). Seeds: Bath salts, Candles,
  Soap, Body scrub, Diffusers.
- **Collection** — id, slug, name, editorial fields; M:N `Product` (curated/seasonal).
- **ProductImage** — id, **productId** (product-owned by default), mediaRef (Cloudinary
  public id), alt (required), position, role(`hero`/`detail`/`lifestyle`/`unboxing`).
  Variant-specific imagery is explicitly deferred (see §8).
- **Ingredient / Benefit / Scent** — reference entities; M:N with Product. Trusted facts.
- **Mood** — reusable reference entity (slug, name); M:N with Product. Catalogue metadata
  (e.g. Relax, Recharge, Unwind, Indulge, Comfort, Reset). Not AI logic.
- **Occasion** — reusable reference entity (slug, name); M:N with Product. Catalogue
  metadata (e.g. Birthday, Mother's Day, Anniversary, Thank You, Self Care, New Mom,
  Bridesmaid, Just Because). Not AI logic.
- **ProductRelationship** — productId, relatedProductId, type(`complementary`/
  `frequently_bought_together`/`related`). Mood/Occasion are NOT stored here as strings;
  they are first-class reference concepts above.
- **AvailabilityStatus (derived, NOT a table)** — `IN_STOCK`/`LOW_STOCK`/`OUT_OF_STOCK`,
  computed at read time from a trusted stock source. Represented as a domain enum/value
  object and an application read-model field — **never a persistent inventory table**.
  See §7.

Extensibility stance: fields for cart/order/payment/review/promotion are intentionally
absent. Reference tables (ingredient/benefit/scent/mood/occasion) and relationships allow
growth without remodelling.

## 3. Application contracts (trusted, AI-consumable later)

- `CatalogueService` / `ProductQueryService` expose typed read models. The
  `ProductReadModel` exposes `moods[]` and `occasions[]` directly as structured
  collections of reference entities, e.g.:
  ```
  ProductReadModel { id, slug, name, story, price, variants[], images[],
                     ingredients[], benefits[], scents[], moods[], occasions[],
                     availability: AvailabilityStatus, ... }
  ```
  Other read models cover product summaries (listings), category tree, collection detail,
  related products, availability, and pricing. All outputs Zod-validated at the
  application boundary.
- Repositories in `src/data` wrap Prisma and map rows → read models. UI and any future AI
  depend on the application contracts, never on Prisma (INV-3, AIR-2).
- These contracts are the single trusted surface a future Bloom Intelligence / Bloom AI
  would read from — shaping them cleanly now avoids a future rewrite (AIR-4). No AI built.

## 4. Repository boundaries

- `src/data` holds Prisma-only repositories: products, variants, categories, collections,
  images, ingredient/benefit/scent, mood/occasion, relationships, availability, search.
- Repositories return read models / domain types, never leak Prisma types upward.
- No Prisma import exists outside `src/data` (enforced by Spec 1 architecture tests,
  extended to new catalogue UI in this Spec).

## 5. Search architecture (V1 Postgres)

- `SearchService.search(query: StructuredQuery): Promise<SearchResults>`.
- `StructuredQuery`: text, filters (category/collection/price), sort, pagination.
- Weighting is a **configuration/value-object** (`SearchWeighting`) carrying actual
  numeric relevance weights, e.g. `{ name: 4, scent: 3, benefit: 2, description: 1 }`
  (values configurable; default order name > scent > benefit > description, FR-19a).
- Implementation: Postgres full-text + `pg_trgm` in the data layer behind the service.
  The Postgres relevance calculation (e.g. `setweight`/`ts_rank` weight labels or
  equivalent) MUST actually apply the `SearchWeighting` values — the abstraction is not
  nominal. Changing weights changes ranking without rewriting `SearchService`.
- Future AI NL search maps free text → `StructuredQuery` and calls the SAME service
  (FR-20). No NL/AI implemented now.

## 6. Recommendation architecture (deterministic)

- `RecommendationService.getRelated(productId, context): RecommendedProduct[]` with
  explainable reasons. Strategy is rule-based (relationships → category → scent → mood →
  curated collections). Interface allows adding ML/vector strategies later without
  changing callers (FR-22). No ML/embeddings/vectors now.

## 7. Inventory read-only boundary & availability derivation

Conceptual flow (no inventory table is created):
```
Inventory/stock source (trusted, external to Spec 2)
   ↓  ReadOnlyStockAvailabilityProvider  (abstract read-only dependency; name may differ)
Read-only availability calculation (applies configurable low-stock threshold, default ≤5)
   ↓
AvailabilityStatus (IN_STOCK | LOW_STOCK | OUT_OF_STOCK)  — domain enum/value object
   ↓
Catalogue application read model (availability field)
   ↓
UI
```

- `AvailabilityStatus` is DERIVED at read time — a domain/read-model concept, **never a
  persistent inventory table** (FR-8, FR-8a).
- Trusted stock is obtained via an abstract `ReadOnlyStockAvailabilityProvider`
  (integration/application boundary). Development/testing uses deterministic seed
  availability data (FR-8b).
- Low-stock threshold via configuration (default ≤5), not hard-coded.
- NOT implemented here (deferred to Commerce/Admin/Inventory Spec): persistent operational
  quantities, stock adjustment, deduction, reservation, receiving, history, warehouse
  management, transactions, reconciliation, operational workflows, inventory UI, and
  order-driven stock changes. No half-inventory system is built for catalogue display.

## 8. Image ownership

- V1 default: **product-owned images** (`ProductImage.productId`).
- Roles retained: `hero`, `detail`, `lifestyle`, `unboxing`; all require `alt`.
- Variant-specific imagery is deferred and only introduced later if a product genuinely
  needs materially different imagery per variant. No variant-image complexity added now.

## 9. Canonical URL strategy

- Canonical product URL is `/products/[slug]` — the ONLY canonical product URL (FR-17a).
- Browse contexts (shop/category/collection/search/recommendations/future AI) link to the
  same canonical URL; no nested product URLs.
- SEO canonical metadata always points to `/products/[slug]`.

## 10. Analytics boundary

Typed events via the Spec 1 `AnalyticsProvider`. **Emitted in Spec 2 (only):**
`product_viewed`, `search_performed`, `collection_viewed`, `category_viewed`,
`product_relationship_clicked`.

Documented as roadmap concepts but **NOT implemented/emitted** in Spec 2: purchase/
checkout/payment, customer, AI, gift-finder, social-conversion, inventory, admin events.

## 11. Mood & Occasion in the catalogue

- First-class, reusable reference concepts (typed entities), associated M:N with products.
- The `ProductReadModel` exposes `moods[]` and `occasions[]` directly as structured
  collections (not free-form blobs, not AI logic) — a clean contract future discovery
  features can consume.
- Used in V1 for catalogue metadata and browse/curation context; consumable by future
  AI/Gift Finder through application-level read models only.
- Kept simple (no scoring, no AI): just reusable reference data surfaced in read models.

## 12. Future-AI readiness (documentation only — NOT built)

The catalogue exposes clean application-level contracts and read models (products,
variants, categories, collections, ingredients, benefits, scents, moods, occasions,
relationships, availability, pricing) plus a typed analytics event schema. This is the
trusted substrate future AI would consume. Governing principle:

```
AI interprets intent → Application services (trusted facts) → Domain rules (authoritative) → Database
```
For any future mutating AI action:
```
AI proposes → Application validates → Human approves → Application executes
```
No AI providers, prompts, embeddings, vector stores, agents, Bloom AI, Gift Finder, or
Bloom Intelligence are created in Spec 2.

## 13. Architecture Decisions

- **AD-1** Catalogue read models via application services; UI/AI never touch Prisma.
- **AD-2** `AvailabilityStatus` is a derived, read-only domain/read-model concept — NOT a
  persistent inventory table; stock is read via an abstract
  `ReadOnlyStockAvailabilityProvider`; reservation/operations deferred.
- **AD-3** `SearchService` uses a `SearchWeighting` value-object whose numeric weights are
  actually applied by the Postgres relevance calculation (not nominal); `SearchService`
  and `RecommendationService` are abstractions with structured inputs so future AI/ML
  plugs in without consumer changes. No AI infrastructure created.
- **AD-4** Images referenced via Cloudinary `MediaProvider`; product-owned in V1.
- **AD-5** Typed analytics contract defined broadly; only catalogue/search events emitted.
- **AD-6** `ProductImage` requires `alt`; enforced at type/schema level.
- **AD-7** Mood/Occasion are first-class reusable reference concepts, not free-form
  strings and not AI logic.
- **AD-8** Canonical product URL locked to `/products/[slug]`.

## 14. Roadmap (corrected 8-phase sequence; quality practices continuous)

1. Foundation & Design System — done (Spec 1).
2. **Catalogue & Product Experience — this Spec.**
3. Commerce — Cart, Checkout, Payments, Shipping, Orders.
4. Customer & Admin — Accounts, Order history, Admin, Inventory management, Promotions,
   Reviews.
5. AI & Discovery — Bloom AI, Gift Finder, Natural-language search, AI recommendations,
   AI gift messages.
6. Launch Readiness — integrated QA, SEO, performance, security, accessibility,
   monitoring, analytics, payment readiness, shipping readiness.
7. Bloom Intelligence / AI Store Operations.
8. Growth & Advanced AI.

Quality practices (testing, a11y, performance, security, boundary enforcement) remain
continuous across every Spec.
