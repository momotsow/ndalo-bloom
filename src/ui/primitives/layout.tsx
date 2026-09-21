import type { ElementType, ReactNode } from "react";
import { cn } from "./cn";

/**
 * Layout & content primitives (server components — no client JS, FR-11).
 *
 * All primitives consume SEMANTIC token utilities (e.g. text-text-primary,
 * bg-surface). None reference raw palette values (FR-5).
 */

type WithChildren = { readonly children?: ReactNode; readonly className?: string };

const maxWidths = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
} as const;

export function Container({
  children,
  className,
  size = "lg",
}: WithChildren & { readonly size?: keyof typeof maxWidths }) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6", maxWidths[size], className)}>
      {children}
    </div>
  );
}

const gaps = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
} as const;

export function Stack({
  children,
  className,
  gap = 4,
  direction = "column",
}: WithChildren & {
  readonly gap?: keyof typeof gaps;
  readonly direction?: "row" | "column";
}) {
  return (
    <div
      className={cn(
        "flex",
        direction === "column" ? "flex-col" : "flex-row",
        gaps[gap],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Grid({
  children,
  className,
  columns = 2,
  gap = 4,
}: WithChildren & {
  readonly columns?: 1 | 2 | 3 | 4;
  readonly gap?: keyof typeof gaps;
}) {
  const cols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  } as const;
  return (
    <div className={cn("grid", cols[columns], gaps[gap], className)}>{children}</div>
  );
}

const headingSizes = {
  1: "text-3xl",
  2: "text-2xl",
  3: "text-xl",
  4: "text-lg",
} as const;

export function Heading({
  children,
  className,
  level = 2,
}: WithChildren & { readonly level?: 1 | 2 | 3 | 4 }) {
  const Tag = `h${level}` as ElementType;
  return (
    <Tag className={cn("font-heading text-text-primary", headingSizes[level], className)}>
      {children}
    </Tag>
  );
}

const textTones = {
  primary: "text-text-primary",
  secondary: "text-text-secondary",
  muted: "text-text-muted",
} as const;

export function Text({
  children,
  className,
  tone = "primary",
  as: Tag = "p",
}: WithChildren & {
  readonly tone?: keyof typeof textTones;
  readonly as?: ElementType;
}) {
  return <Tag className={cn(textTones[tone], className)}>{children}</Tag>;
}

export function Card({ children, className }: WithChildren) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

const badgeTones = {
  neutral: "bg-surface-muted text-text-secondary",
  accent: "bg-accent text-accent-foreground",
  success: "bg-success text-white",
  warning: "bg-warning text-white",
  error: "bg-error text-white",
} as const;

export function Badge({
  children,
  className,
  tone = "neutral",
}: WithChildren & { readonly tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
