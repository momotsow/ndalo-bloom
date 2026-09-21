"use client";

import { forwardRef, type ReactNode } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { cn } from "./cn";

/**
 * Select built on Radix Select (accessible listbox, keyboard + typeahead).
 */
export function Select(props: RadixSelect.SelectProps) {
  return <RadixSelect.Root {...props} />;
}

export const SelectTrigger = forwardRef<
  React.ElementRef<typeof RadixSelect.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger> & {
    readonly placeholder?: string;
  }
>(function SelectTrigger({ className, placeholder, children, ...props }, ref) {
  return (
    <RadixSelect.Trigger
      ref={ref}
      className={cn(
        "inline-flex w-full items-center justify-between rounded-md border " +
          "border-border bg-surface px-3 py-2 text-text-primary " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus " +
          "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children ?? <RadixSelect.Value placeholder={placeholder} />}
      <RadixSelect.Icon aria-hidden="true">▾</RadixSelect.Icon>
    </RadixSelect.Trigger>
  );
});

export function SelectContent({ children }: { readonly children: ReactNode }) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content className="overflow-hidden rounded-md border border-border bg-surface shadow-md">
        <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  );
}

export const SelectItem = forwardRef<
  React.ElementRef<typeof RadixSelect.Item>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <RadixSelect.Item
      ref={ref}
      className={cn(
        "flex cursor-pointer select-none items-center rounded-sm px-3 py-2 " +
          "text-text-primary outline-none data-[highlighted]:bg-surface-muted",
        className,
      )}
      {...props}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
});
