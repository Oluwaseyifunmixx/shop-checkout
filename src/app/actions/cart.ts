"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { MAX_QUANTITY } from "@/lib/cart";


export type CartActionResult =
  | { ok: true }
  | {
      ok: false;
      code: "SIGN_IN_REQUIRED" | "INVALID_INPUT" | "SERVER_ERROR";
      message: string;
    };

const idSchema = z.uuid();
const quantitySchema = z.number().int().min(1).max(MAX_QUANTITY);

const SIGN_IN_REQUIRED: CartActionResult = {
  ok: false,
  code: "SIGN_IN_REQUIRED",
  message: "Sign in to use your cart.",
};

const INVALID_INPUT: CartActionResult = {
  ok: false,
  code: "INVALID_INPUT",
  message: "Something about that request wasn't right.",
};

function serverError(context: string, error: unknown): CartActionResult {
  console.error(`[cart:${context}]`, error);
  return {
    ok: false,
    code: "SERVER_ERROR",
    message: "Something went wrong. Please try again.",
  };
}

async function getSupabaseWithUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function addToCart(productId: string): Promise<CartActionResult> {
  if (!idSchema.safeParse(productId).success) {
    return INVALID_INPUT;
  }

  const { supabase, user } = await getSupabaseWithUser();

  if (!user) {
    return SIGN_IN_REQUIRED;
  }

  const { data: existing, error: readError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
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
        .insert({ user_id: user.id, product_id: productId, quantity: 1 });

  if (error) {
    return serverError("add", error);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCartQuantity(
  itemId: string,
  quantity: number
): Promise<CartActionResult> {
  if (
    !idSchema.safeParse(itemId).success ||
    !quantitySchema.safeParse(quantity).success
  ) {
    return INVALID_INPUT;
  }

  const { supabase, user } = await getSupabaseWithUser();

  if (!user) {
    return SIGN_IN_REQUIRED;
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId);

  if (error) {
    return serverError("update", error);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeFromCart(itemId: string): Promise<CartActionResult> {
  if (!idSchema.safeParse(itemId).success) {
    return INVALID_INPUT;
  }

  const { supabase, user } = await getSupabaseWithUser();

  if (!user) {
    return SIGN_IN_REQUIRED;
  }

  const { error } = await supabase.from("cart_items").delete().eq("id", itemId);

  if (error) {
    return serverError("remove", error);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}