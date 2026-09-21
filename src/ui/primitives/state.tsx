import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * State patterns (server-compatible, no client JS).
 *
 * Loading: an accessible busy indicator with a status role.
 * Empty:   a neutral empty-state with optional action.
 * Error:   an alert region for recoverable errors with optional retry action.
 */

export function Loading({
  label = "Loading",
  className,
}: {
  readonly label?: string;
  readonly className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex items-center gap-2 text-text-secondary", className)}
    >
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
      />
      <span>{label}</span>
    </div>
  );
}

export function Empty({
  title,
  description,
  action,
  className,
}: {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 py-10 text-center", className)}>
      <p className="font-heading text-lg text-text-primary">{title}</p>
      {description ? <p className="text-text-secondary">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: {
  readonly title?: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center gap-2 py-10 text-center", className)}
    >
      <p className="font-heading text-lg text-error">{title}</p>
      {description ? <p className="text-text-secondary">{description}</p> : null}
      {action}
    </div>
  );
}
