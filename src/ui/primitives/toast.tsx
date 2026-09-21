"use client";

import { forwardRef, type ReactNode } from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { cn } from "./cn";

/**
 * Toast built on Radix Toast (accessible live-region announcements + swipe/close).
 * Wrap the app in ToastProvider and render a single ToastViewport.
 */
export const ToastProvider = RadixToast.Provider;
export const ToastTitle = RadixToast.Title;
export const ToastDescription = RadixToast.Description;
export const ToastAction = RadixToast.Action;
export const ToastClose = RadixToast.Close;

export function ToastViewport() {
  return (
    <RadixToast.Viewport className="fixed bottom-0 right-0 z-50 flex w-96 max-w-[100vw] flex-col gap-2 p-4" />
  );
}

const tones = {
  neutral: "border-border",
  success: "border-success",
  error: "border-error",
} as const;

export const Toast = forwardRef<
  React.ElementRef<typeof RadixToast.Root>,
  React.ComponentPropsWithoutRef<typeof RadixToast.Root> & {
    readonly tone?: keyof typeof tones;
    readonly children: ReactNode;
  }
>(function Toast({ className, tone = "neutral", children, ...props }, ref) {
  return (
    <RadixToast.Root
      ref={ref}
      className={cn(
        "rounded-md border-l-4 bg-surface p-4 shadow-md motion-reduce:transition-none",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </RadixToast.Root>
  );
});
