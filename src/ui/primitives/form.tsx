"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import * as RadixLabel from "@radix-ui/react-label";
import { cn } from "./cn";

/**
 * Form primitives.
 *
 * Radix Label is used for correct label association. Input/Textarea are thin,
 * accessible wrappers. FormField composes a label, control, description, and
 * error message with the correct aria-* wiring.
 */

export const Label = forwardRef<
  HTMLLabelElement,
  React.ComponentPropsWithoutRef<typeof RadixLabel.Root>
>(function Label({ className, ...props }, ref) {
  return (
    <RadixLabel.Root
      ref={ref}
      className={cn("text-sm font-medium text-text-primary", className)}
      {...props}
    />
  );
});

const controlBase =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary " +
  "placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60 " +
  "aria-[invalid=true]:border-error";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlBase, className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea ref={ref} className={cn(controlBase, "min-h-24", className)} {...props} />
  );
});

export interface FormFieldProps {
  readonly label: string;
  readonly children: (ids: {
    readonly id: string;
    readonly describedBy: string | undefined;
    readonly invalid: boolean;
  }) => ReactNode;
  readonly description?: string;
  readonly error?: string;
  readonly className?: string;
}

/**
 * FormField wires label + control + description + error with correct aria
 * attributes. The control is rendered via a render prop so the caller receives
 * the generated ids to spread onto the control.
 */
export function FormField({
  label,
  children,
  description,
  error,
  className,
}: FormFieldProps) {
  const id = useId();
  const descriptionId = description ? `${id}-desc` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {description ? (
        <p id={descriptionId} className="text-sm text-text-secondary">
          {description}
        </p>
      ) : null}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
