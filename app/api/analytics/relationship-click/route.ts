import { NextResponse } from "next/server";
import { z } from "zod";
import { catalogueAnalytics } from "@/application/analytics";

/**
 * Emits product_relationship_clicked server-side (Spec 2, FR-26). The client tracker
 * calls this via sendBeacon. Input is validated; analytics failures never surface to
 * the customer. No provider SDK is used here — emission goes through the application
 * analytics boundary.
 */
const schema = z.object({
  fromProductId: z.string().min(1),
  toProductId: z.string().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    catalogueAnalytics.track({
      name: "product_relationship_clicked",
      properties: {
        fromProductId: parsed.data.fromProductId,
        toProductId: parsed.data.toProductId,
        reason: "related",
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
