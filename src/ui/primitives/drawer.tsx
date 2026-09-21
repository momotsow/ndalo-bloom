"use client";

import { forwardRef, type ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "./cn";

/**
 * Drawer / Sheet.
 *
 * DESIGN DECISION (FR-13): Radix has no dedicated Drawer primitive. We build the
 * Drawer on Radix Dialog to reuse its proven modal accessibility (focus trap,
 * aria-modal, ESC / overlay dismissal) rather than adding another dependency.
 * Only the positioning and slide-in styling differ from Dialog. A title is
 * required for an accessible name.
 */
export const Drawer = RadixDialog.Root;
export const DrawerTrigger = RadixDialog.Trigger;
export const DrawerClose = RadixDialog.Close;
export const DrawerTitle = RadixDialog.Title;
export const DrawerDescription = RadixDialog.Description;

const sides = {
  right: "right-0 top-0 h-full w-80 max-w-[90vw]",
  left: "left-0 top-0 h-full w-80 max-w-[90vw]",
  bottom: "bottom-0 left-0 w-full max-h-[90vh]",
} as const;

export const DrawerContent = forwardRef<
  React.ElementRef<typeof RadixDialog.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & {
    readonly side?: keyof typeof sides;
    readonly children: ReactNode;
  }
>(function DrawerContent({ className, side = "right", children, ...props }, ref) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 bg-black/40 motion-reduce:transition-none" />
      <RadixDialog.Content
        ref={ref}
        className={cn(
          "fixed border-border bg-surface p-6 shadow-lg focus-visible:outline-none",
          sides[side],
          side === "right" || side === "left" ? "border-x" : "border-t",
          className,
        )}
        {...props}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});
