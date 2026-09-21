import NextLink from "next/link";
import type { ComponentProps } from "react";
import { cn } from "./cn";

/**
 * Link primitive wrapping next/link with consistent focus + accent styling.
 * External links should pass rel/target explicitly by the caller.
 *
 * Props are derived from next/link's component type so this stays correct with
 * typedRoutes (where next/link's own LinkProps is generic).
 */
export type LinkProps = ComponentProps<typeof NextLink>;

export function Link({ className, children, ...props }: LinkProps) {
  return (
    <NextLink
      className={cn(
        "text-accent underline-offset-2 hover:underline " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-sm",
        className,
      )}
      {...props}
    >
      {children}
    </NextLink>
  );
}
