/**
 * Root route placeholder.
 *
 * The real Ndalo Bloom homepage is delivered in a later Spec. Foundation deliberately
 * does NOT ship a storefront homepage. This placeholder exists only so the app has a
 * valid root route; the Foundation design-system showcase lives at /dev/foundation
 * (development only).
 */
export default function RootPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading text-2xl text-text-primary">Ndalo Bloom</h1>
      <p className="mt-4 text-text-secondary">
        This site is under construction. The storefront is delivered in a later Spec.
      </p>
    </main>
  );
}
