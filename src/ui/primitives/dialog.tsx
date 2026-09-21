"use client";

import { forwardRef, type ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "./cn";

/**
 * Dialog built on Radix Dialog: modal semantics, focus trap, aria-modal, ESC and
 * overlay dismissal. A title is required for an accessible name; use
 * DialogTitle (visually hidden if necessary).
 */
export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;

export const DialogContent = forwardRef<
  React.ElementRef<typeof RadixDialog.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & {
    readonly children: ReactNode;
  }
>(function DialogContent({ className, children, ...props }, ref) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        className={cn(
          "fixed inset-0 bg-black/40 data-[state=open]:animate-in",
          "motion-reduce:transition-none",
        )}
      />
      <RadixDialog.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 " +
            "-translate-y-1/2 rounded-lg border border-border bg-surface p-6 shadow-lg " +
            "focus-visible:outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});
