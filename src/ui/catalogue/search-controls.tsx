"use client";

import { Input, Label } from "@/ui/primitives/form";
import { Button } from "@/ui/primitives/button";

/**
 * Search controls (catalogue-scoped). An accessible GET form: query input + sort. Uses
 * native form submission (server-first results), so it works without JS and is fully
 * keyboard operable. No data access.
 */
export function SearchControls({
  defaultQuery,
  defaultSort,
}: {
  readonly defaultQuery: string;
  readonly defaultSort: string;
}) {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="search-q">Search products</Label>
        <Input
          id="search-q"
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder="Something relaxing…"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="search-sort">Sort</Label>
        <select
          id="search-sort"
          name="sort"
          defaultValue={defaultSort}
          className="h-10 rounded-md border border-border bg-surface px-3 text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>
      <Button type="submit">Search</Button>
    </form>
  );
}
