/**
 * Product relationship types (Spec 2, FR-7). Pure domain concept mirrored by the
 * Prisma enum; kept framework-independent so domain/application code does not import
 * Prisma types.
 */
export const ProductRelationshipType = {
  COMPLEMENTARY: "COMPLEMENTARY",
  FREQUENTLY_BOUGHT_TOGETHER: "FREQUENTLY_BOUGHT_TOGETHER",
  RELATED: "RELATED",
} as const;

export type ProductRelationshipType =
  (typeof ProductRelationshipType)[keyof typeof ProductRelationshipType];
