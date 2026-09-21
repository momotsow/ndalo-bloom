import { Badge } from "@/ui/primitives/layout";

/**
 * Availability badge (catalogue-scoped, presentational). Consumes a derived
 * AvailabilityStatus value; contains no data access or provider code.
 */
type Availability = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

const LABELS: Record<Availability, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
};

const TONES = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "error",
} as const;

export function AvailabilityBadge({ status }: { readonly status: Availability }) {
  return <Badge tone={TONES[status]}>{LABELS[status]}</Badge>;
}
