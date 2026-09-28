import { randomBytes } from "node:crypto";

/**
 * Guest cart token (Spec 3, §4, FR-1/S-2). Opaque, unguessable, server-issued. The token
 * is stored in an http-only cookie by the app/route layer; the Application layer only
 * generates and validates its shape.
 */

export const CART_COOKIE_NAME = "ndalo_cart";
export const CART_RETENTION_DAYS = 30;
export const CART_COOKIE_MAX_AGE_SECONDS = CART_RETENTION_DAYS * 24 * 60 * 60;

/** 256-bit base64url token. */
export function generateCartToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Basic shape validation for a cart token (base64url, reasonable length). */
export function isValidCartTokenShape(token: string | undefined | null): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{20,128}$/.test(token);
}

/** Retention horizon from now (sliding window). */
export function nextExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + CART_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}
