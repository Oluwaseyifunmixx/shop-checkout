import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { MAX_QUANTITY } from "@/lib/cart";

// The database side of the cart, shared by the website's server actions and
// the mobile API routes. Callers pass in a Supabase client that acts as the
// signed-in user, so Row Level Security protects each shopper's own cart.

export type CartResult =
  | { ok: true }
  | {
      ok: false;
      code: "INVALID_INPUT" | "SERVER_ERROR";
      message: string;
    };

const idSchema = z.uuid();
const quantitySchema = z.number().int().min(1).max(MAX_QUANTITY);

const INVALID_INPUT: CartResult = {
  ok: false,
  code: "INVALID_INPUT",
  message: "Something about that request wasn't right.",
};

function serverError(context: string, error: unknown): CartResult {
  console.error(`[cart:${context}]`, error);
  return {
    ok: false,
    code: "SERVER_ERROR",
    message: "Something went wrong. Please try again.",
  };
}

export async function addItem(
  supabase: SupabaseClient,
  userId: string,
  productId: unknown
): Promise<CartResult> {
  const parsedId = idSchema.safeParse(productId);

  if (!parsedId.success) {
    return INVALID_INPUT;
  }

  const { data: existing, error: readError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", parsedId.data)
    .maybeSingle();

  if (readError) {
    return serverError("add", readError);
  }

  const { error } = existing
    ? await supabase
        .from("cart_items")
        .update({ quantity: Math.min(existing.quantity + 1, MAX_QUANTITY) })
        .eq("id", existing.id)
    : await supabase
        .from("cart_items")
        .insert({ user_id: userId, product_id: parsedId.data, quantity: 1 });

  if (error) {
    return serverError("add", error);
  }

  return { ok: true };
}

export async function setItemQuantity(
  supabase: SupabaseClient,
  itemId: unknown,
  quantity: unknown
): Promise<CartResult> {
  const parsedId = idSchema.safeParse(itemId);
  const parsedQuantity = quantitySchema.safeParse(quantity);

  if (!parsedId.success || !parsedQuantity.success) {
    return INVALID_INPUT;
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: parsedQuantity.data })
    .eq("id", parsedId.data);

  if (error) {
    return serverError("update", error);
  }

  return { ok: true };
}

export async function removeItem(
  supabase: SupabaseClient,
  itemId: unknown
): Promise<CartResult> {
  const parsedId = idSchema.safeParse(itemId);

  if (!parsedId.success) {
    return INVALID_INPUT;
  }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", parsedId.data);

  if (error) {
    return serverError("remove", error);
  }

  return { ok: true };
}