"use client";

import { forwardRef } from "react";
import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import { cn } from "./cn";

/**
 * Radio group built on Radix RadioGroup (roving focus + arrow-key navigation).
 */
export const RadioGroup = forwardRef<
  React.ElementRef<typeof RadixRadioGroup.Root>,
  React.ComponentPropsWithoutRef<typeof RadixRadioGroup.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return (
    <RadixRadioGroup.Root
      ref={ref}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
});

export const Radio = forwardRef<
  React.ElementRef<typeof RadixRadioGroup.Item>,
  React.ComponentPropsWithoutRef<typeof RadixRadioGroup.Item>
>(function Radio({ className, ...props }, ref) {
  return (
    <RadixRadioGroup.Item
      ref={ref}
      className={cn(
        "h-5 w-5 rounded-full border border-border bg-surface " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus " +
          "data-[state=checked]:border-accent disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <RadixRadioGroup.Indicator className="flex h-full w-full items-center justify-center">
        <span className="h-2 w-2 rounded-full bg-accent" />
      </RadixRadioGroup.Indicator>
    </RadixRadioGroup.Item>
  );
});
