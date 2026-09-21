/**
 * Price display (catalogue-scoped, presentational). Formats integer ZAR cents into a
 * localised ZAR string. Pure component; no data access.
 */
const formatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

export function Price({
  cents,
  from = false,
}: {
  readonly cents: number;
  readonly from?: boolean;
}) {
  const value = formatter.format(cents / 100);
  return (
    <span className="text-text-primary">
      {from ? <span className="text-text-muted text-sm">from </span> : null}
      {value}
    </span>
  );
}
