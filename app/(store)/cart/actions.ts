"use server";

import { cookies, headers } from "next/headers";
import { cartService, type CartResult } from "@/application/cart/cart-service";
import {
  addItemInputSchema,
  updateItemInputSchema,
  removeItemInputSchema,
  type CartReadModel,
} from "@/application/cart/read-models";
import {
  CART_COOKIE_NAME,
  CART_COOKIE_MAX_AGE_SECONDS,
  isValidCartTokenShape,
} from "@/application/cart/cart-token";
import { CartError, cartErrors } from "@/application/cart/errors";
import { cartAnalytics } from "@/application/analytics";
import { checkRateLimit } from "@/lib/rate-limit";
import { ZodError } from "zod";

/**
 * Cart server actions (Spec 3, §9). The app/route boundary: reads/writes the cart cookie,
 * enforces rate limiting, calls CartService, emits approved analytics, and returns a typed
 * result. No Prisma/provider SDK imports here.
 */

export type CartActionResult =
  | { ok: true; cart: CartReadModel }
  | { ok: false; code: string; message: string };

const RATE_LIMIT = 60; // mutations
const RATE_WINDOW_MS = 60_000; // per minute

async function currentToken(): Promise<string | undefined> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE_NAME)?.value;
  return isValidCartTokenShape(raw) ? raw : undefined;
}

async function persist(result: CartResult): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE_SECONDS,
    expires: result.expiresAt,
  });
}

async function rateLimited(op: string): Promise<boolean> {
  const token = (await currentToken()) ?? "anon";
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const key = `cart:${op}:${token}:${ip}`;
  return !checkRateLimit(key, RATE_LIMIT, RATE_WINDOW_MS).allowed;
}

function toError(e: unknown): CartActionResult {
  if (e instanceof CartError) {
    return { ok: false, code: e.code, message: e.customerMessage };
  }
  if (e instanceof ZodError) {
    // Invalid input at the boundary (e.g. quantity out of 1..99) → typed, safe message.
    const err = cartErrors.invalidQuantity();
    return { ok: false, code: err.code, message: err.customerMessage };
  }
  // Safe generic message; details go to Sentry (observability), not the client.
  return { ok: false, code: "CART_ERROR", message: "We couldn't update your cart." };
}

export async function getCartAction(): Promise<CartActionResult> {
  try {
    const result = await cartService.getCart({ token: await currentToken() });
    await persist(result);
    cartAnalytics.track({
      name: "cart_viewed",
      properties: {
        itemCount: result.cart.itemCount,
        subtotalCents: result.cart.subtotalCents,
      },
    });
    return { ok: true, cart: result.cart };
  } catch (e) {
    return toError(e);
  }
}

export async function addItemAction(input: unknown): Promise<CartActionResult> {
  try {
    if (await rateLimited("add")) {
      return {
        ok: false,
        code: "RATE_LIMITED",
        message: "Too many requests. Please slow down.",
      };
    }
    const parsed = addItemInputSchema.parse(input);
    const result = await cartService.addItem({ token: await currentToken() }, parsed);
    await persist(result);
    cartAnalytics.track({
      name: "add_to_cart",
      properties: { variantId: parsed.variantId, quantity: parsed.quantity },
    });
    return { ok: true, cart: result.cart };
  } catch (e) {
    return toError(e);
  }
}

export async function updateItemAction(input: unknown): Promise<CartActionResult> {
  try {
    if (await rateLimited("update")) {
      return {
        ok: false,
        code: "RATE_LIMITED",
        message: "Too many requests. Please slow down.",
      };
    }
    const parsed = updateItemInputSchema.parse(input);
    const result = await cartService.updateItemQuantity(
      { token: await currentToken() },
      parsed,
    );
    await persist(result);
    cartAnalytics.track({
      name: "cart_quantity_updated",
      properties: { variantId: parsed.variantId, quantity: parsed.quantity },
    });
    return { ok: true, cart: result.cart };
  } catch (e) {
    return toError(e);
  }
}

export async function removeItemAction(input: unknown): Promise<CartActionResult> {
  try {
    if (await rateLimited("remove")) {
      return {
        ok: false,
        code: "RATE_LIMITED",
        message: "Too many requests. Please slow down.",
      };
    }
    const parsed = removeItemInputSchema.parse(input);
    const result = await cartService.removeItem({ token: await currentToken() }, parsed);
    await persist(result);
    cartAnalytics.track({
      name: "remove_from_cart",
      properties: { variantId: parsed.variantId },
    });
    return { ok: true, cart: result.cart };
  } catch (e) {
    return toError(e);
  }
}

export async function clearCartAction(): Promise<CartActionResult> {
  try {
    if (await rateLimited("clear")) {
      return {
        ok: false,
        code: "RATE_LIMITED",
        message: "Too many requests. Please slow down.",
      };
    }
    const result = await cartService.clearCart({ token: await currentToken() });
    await persist(result);
    return { ok: true, cart: result.cart };
  } catch (e) {
    return toError(e);
  }
}
