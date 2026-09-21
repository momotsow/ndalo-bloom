"use client";

import { forwardRef } from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { cn } from "./cn";

/**
 * Checkbox built on Radix Checkbox (accessible state + keyboard support).
 */
export const Checkbox = forwardRef<
  React.ElementRef<typeof RadixCheckbox.Root>,
  React.ComponentPropsWithoutRef<typeof RadixCheckbox.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <RadixCheckbox.Root
      ref={ref}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-sm border border-border " +
          "bg-surface focus-visible:outline-none focus-visible:ring-2 " +
          "focus-visible:ring-focus data-[state=checked]:border-accent " +
          "data-[state=checked]:bg-accent disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator className="text-accent-foreground">
        <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
          <path
            d="M2 6l2.5 2.5L10 3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
});
