# Catalogue & Product Experience — Requirements

**Spec:** catalogue-product-experience (Spec 2)
**Phase:** 2 (Catalogue & Product Experience)
**Priority:** P0 catalogue/product/pages; P1 search/collections/rule-based recommendations
**Status:** Revised — awaiting review. No implementation.
**Depends on:** foundation-design-system (Spec 1)
**Source of truth:** Ndalo Bloom Master Product Brief + steering documents.

## Purpose

Define the catalogue domain, the storefront/product experience, V1 PostgreSQL search,
deterministic rule-based recommendations, SEO, performance, and accessibility for
Ndalo Bloom — built on the approved Next.js modular monolith
(`UI/app → Application → Domain → Data/Integration interfaces → Infrastructure/Providers`).

This Spec delivers trusted, structured catalogue data through clean application-level
contracts so that a future AI layer (customer-facing Bloom AI and business-facing Bloom
Intelligence) can consume it later — **without** implementing any AI here.

## Architecture invariants (carried from Spec 1, must not change)

- INV-1: Single Next.js App Router modular monolith. No NestJS, separate backend, or
  microservices.
- INV-2: Dependency direction `UI → Application → Domain → Data/Integration → Providers`.
- INV-3: UI never imports Prisma or third-party SDKs directly. Prisma stays in `src/data`.
- INV-4: Business rules live in Domain/Application, never in UI components.
- INV-5: External providers stay behind integration interfaces; imagery uses the
  Cloudinary `MediaProvider` boundary.
- INV-6: Money in integer minor units (ZAR cents); catalogue reads are server-first.
- INV-7: Future AI consumes application-level contracts/read models, never Prisma; AI is
  never the source of truth.

## AI-readiness principle (design influence only — nothing AI is built here)

- AIR-1: AI must NEVER be the source of truth for prices, stock, products, ingredients,
  benefits, orders, payments, shipping, customer records, or analytics data.
- AIR-2: Future AI consumes application-level catalogue contracts/read models, never
  Prisma, and never mutates commerce facts.
- AIR-3: No AI-specific logic is placed inside the catalogue domain.
- AIR-4: `SearchService`, `RecommendationService`, catalogue read models, and analytics
  event contracts are shaped so future AI can be layered on without a rewrite. This
  influences interface shape only; no AI infrastructure is created.

## Functional Requirements (EARS)

### Catalogue domain
- FR-1: The system SHALL model `Product` with identity, slug, name, editorial
  description/story, status (`draft`/`active`/`archived`), category association, SEO
  fields, and timestamps.
- FR-2: The system SHALL model `ProductVariant` (e.g. size/scent) with sku, price
  (integer ZAR cents), a read-only availability concept, and position.
- FR-3: The system SHALL model `Category` as a hierarchy (self-referential parent) with
  slug and name, supporting the initial categories: Bath salts, Candles, Soap, Body
  scrub, Diffusers.
- FR-4: The system SHALL model `Collection` (curated/seasonal) with a many-to-many
  relationship to products and editorial fields.
- FR-5: The system SHALL model `ProductImage` as **product-owned by default** (belonging
  to `Product`), with a stored media reference (Cloudinary `MediaProvider`), REQUIRED
  `alt` text, `position`, and a `role` (`hero`/`detail`/`lifestyle`/`unboxing`).
  Variant-specific imagery SHALL NOT be implemented in V1; it may be introduced later
  only if a product genuinely requires materially different imagery per variant.
- FR-6: The system SHALL model `Ingredient`, `Benefit`, and `Scent` as reference entities
  with many-to-many relationships to products. These are trusted facts; future AI may
  read but never invent them.
- FR-7: The system SHALL model `ProductRelationship` with a typed relation
  (`complementary` | `frequently_bought_together` | `related`). Mood/occasion SHALL NOT
  be free-form strings inside relationships (see FR-7a/FR-7b).
- FR-7a: The system SHALL model `Mood` as a reusable, typed catalogue reference concept
  (e.g. Relax, Recharge, Unwind, Indulge, Comfort, Reset), associable with products
  (many-to-many). It is catalogue metadata, not AI logic.
- FR-7b: The system SHALL model `Occasion` as a reusable, typed catalogue reference
  concept (e.g. Birthday, Mother's Day, Anniversary, Thank You, Self Care, New Mom,
  Bridesmaid, Just Because), associable with products (many-to-many). It is catalogue
  metadata, not AI logic. Mood/Occasion SHALL remain simple V1 reference concepts (no
  over-engineering) and SHALL be consumable by future AI/Gift Finder through
  application-level read models only.
- FR-7c: The Product read model SHALL expose `moods[]` and `occasions[]` directly as
  structured collections of reference entities (not free-form metadata blobs, not AI
  logic), establishing a clean catalogue contract for future discovery features.
- FR-8: The system SHALL expose a read-only availability concept per variant as an
  `AvailabilityStatus` (`IN_STOCK` | `LOW_STOCK` | `OUT_OF_STOCK`) DERIVED at read time
  from a trusted stock source, using a configurable low-stock threshold (default
  `LOW_STOCK <= 5`). The threshold SHALL NOT be hard-coded throughout the application.
- FR-8a: `AvailabilityStatus` SHALL be a domain/read-model concept (a domain enum/value
  object and/or an application read-model field), NOT a persistent inventory model. Spec 2
  SHALL NOT create an Availability/inventory database table that represents inventory
  operations or persistent operational stock quantities.
- FR-8b: The system SHALL obtain trusted stock/availability via an abstract, read-only
  dependency (conceptually a `ReadOnlyStockAvailabilityProvider`; the exact name may
  differ to fit the architecture). Spec 2 MAY consume trusted stock availability, expose
  availability per `ProductVariant`, and use deterministic development/seed availability
  data for development/testing.
- FR-8c: The system SHALL treat inventory as a READ-ONLY dependency. It SHALL NOT
  implement persistent operational inventory quantities, stock adjustment, deduction,
  reservation, receiving, history, warehouse management, inventory transactions,
  reconciliation, operational inventory workflows, inventory management UI, or
  order-driven stock changes. The later Commerce/Admin/Inventory Spec owns the real
  inventory implementation. The system SHALL NOT build a half-inventory system merely to
  support catalogue display.
- FR-9: The catalogue model SHALL be extensible without prematurely modelling future
  features (no cart/order/payment/review/promotion fields here).

### Catalogue application contracts (trusted, AI-consumable later)
- FR-10: The system SHALL expose application-level services (e.g. `CatalogueService`,
  `ProductQueryService`) returning typed, validated read models for products, variants,
  categories, collections, ingredients, benefits, scents, moods, occasions,
  relationships, availability (as derived `AvailabilityStatus`), and pricing. The Product
  read model SHALL expose `moods[]` and `occasions[]` as structured collections (FR-7c).
  UI and any future AI consume these contracts, not Prisma.
- FR-11: Read models SHALL be validated (Zod) at the application boundary before leaving
  the application layer.

### Product experience
- FR-12: The system SHALL provide a catalogue/shop experience listing products with
  category/collection context, editorial presentation, and server-side pagination with a
  progressive "Load More".
- FR-13: The system SHALL provide a collection experience and a category experience.
- FR-14: The system SHALL provide a product detail experience communicating: product
  story, imagery gallery, price, variants, ingredients, benefits, scent, availability,
  and related/complementary products.
- FR-15: The product information hierarchy SHALL lead with emotional/editorial content
  before dense specification (feel before facts).
- FR-16: The experience SHALL be mobile-first and responsive, and SHALL feel premium,
  feminine, lush, editorial, sensory, modern, and fast (not a generic marketplace).
- FR-17: All catalogue/product/search surfaces SHALL provide accessible loading, empty,
  and error states using the Spec 1 state primitives.

### Product URL strategy
- FR-17a: The canonical product URL SHALL be `/products/[slug]` and SHALL be the ONLY
  canonical product URL. A product SHALL resolve to the same canonical URL regardless of
  discovery path (shop, category, collection, search, recommendations, future AI). Nested
  product URLs (e.g. `/categories/[c]/products/[slug]`) SHALL NOT be introduced. Canonical
  metadata SHALL always point to `/products/[slug]`.

### Search (V1 PostgreSQL only)
- FR-18: The system SHALL provide PostgreSQL-based product search (full-text +
  `pg_trgm`) over relevant catalogue attributes, behind a `SearchService` exposing
  `search(query: StructuredQuery): Promise<SearchResults>`.
- FR-19: The system SHALL support filtering by category and collection, price filtering
  where appropriate, and sorting; and SHALL handle empty results and failures gracefully.
- FR-19a: Search weighting SHALL be configurable via a `SearchWeighting`
  configuration/value-object representing ACTUAL relevance weights used by the PostgreSQL
  search implementation (e.g. name:4, scent:3, benefit:2, description:1 — values
  configurable). The PostgreSQL relevance calculation SHALL actually use these weights;
  the abstraction SHALL NOT be nominal while the SQL ignores it. Changing weights SHALL
  NOT require rewriting `SearchService`. The default ordering SHALL remain name > scent >
  benefit > description.
- FR-20: The `SearchService` contract SHALL be shaped so a future AI natural-language
  layer can translate intent into the same `StructuredQuery`. NL/AI search is NOT
  implemented in this Spec.

### Recommendations (deterministic/rule-based only)
- FR-21: The system SHALL provide a `RecommendationService` producing deterministic,
  rule-based recommendations from product relationships, category, scent, mood, and
  curated collections, with explainable, brand-voiced reasons.
- FR-22: The system SHALL NOT implement ML, embeddings, vector search, behavioural
  personalisation, or AI-generated recommendations. The `RecommendationService` contract
  SHALL allow such strategies to be added later without changing consumers.

### SEO
- FR-23: The system SHALL provide per-product and per-collection metadata, canonical URLs
  (always `/products/[slug]`), breadcrumbs, Product + BreadcrumbList structured data
  (JSON-LD), correct indexability, sitemap entries, and social/Open Graph metadata.

### Performance
- FR-24: The system SHALL favour Server Components and server-side data access, use the
  Cloudinary media abstraction with optimized/responsive images, minimise client
  JavaScript, and use caching/revalidation, upholding "luxury should never mean slow."

### Accessibility
- FR-25: The system SHALL support keyboard navigation, semantic structure and heading
  hierarchy, accessible imagery (meaningful `alt`), accessible controls, visible focus,
  screen-reader-friendly states, accessible search/filtering, and reduced motion.

### Analytics events (Spec-2-limited)
- FR-26: The system SHALL define a strongly-typed event contract (emitted via the Spec 1
  `AnalyticsProvider`) and SHALL emit ONLY these events in Spec 2: `product_viewed`,
  `search_performed`, `collection_viewed`, `category_viewed`,
  `product_relationship_clicked`. Future event categories (commerce/checkout/payment/
  customer/AI/gift-finder/social/inventory/admin) MAY be documented as roadmap concepts
  but SHALL NOT be implemented or emitted in Spec 2.

### Seed content
- FR-27: Seed catalogue content and imagery SHALL be treated as temporary development
  content only (local dev, tests, Storybook, preview, UX validation). Seed copy,
  photography, imagery, claims, ingredients, benefits, pricing, and brand content SHALL
  NOT be treated as production-approved. Production launch requires approved Ndalo Bloom
  content/imagery. The system SHALL NOT create a dependency on placeholder imagery being
  production-suitable.

## Non-Functional Requirements
- NFR-1: Type-safe end to end (strict TS); validated boundaries (Zod).
- NFR-2: Server-first rendering; minimal client bundles; Core Web Vitals budgets upheld.
- NFR-3: Accessibility is testable (axe in CI + documented manual checks).
- NFR-4: Catalogue read models are the trusted source; no AI or client may assert
  commerce facts.

## Explicitly OUT OF SCOPE (not in this Spec)
Cart, Checkout, Payments (PayFast/Payflex/PayJustNow), Shipping (Bob Go), Orders, order
management, Wishlist, Reviews, Promotions, Customer accounts, Auth screens/flows,
inventory management/operations, admin operations, Bloom AI, AI Gift Finder, AI
recommendations, NL AI search, AI gift messages, Bloom Intelligence / AI Store Operations,
rituals, UGC, loyalty, referrals, ML/vector/embeddings, microservices, NestJS, separate
backend.

## Traceability
Each FR maps to a design decision (design.md) and one or more tasks (tasks.md), each with
acceptance criteria and a Definition of Done entry.
