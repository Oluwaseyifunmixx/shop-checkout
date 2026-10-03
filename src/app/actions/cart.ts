"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addItem, removeItem, setItemQuantity } from "@/lib/cart-service";

export type CartActionResult =
  | { ok: true }
  | {
      ok: false;
      code: "SIGN_IN_REQUIRED" | "INVALID_INPUT" | "SERVER_ERROR";
      message: string;
    };

const SIGN_IN_REQUIRED: CartActionResult = {
  ok: false,
  code: "SIGN_IN_REQUIRED",
  message: "Sign in to use your cart.",
};

async function getSupabaseWithUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function addToCart(productId: string): Promise<CartActionResult> {
  const { supabase, user } = await getSupabaseWithUser();

  if (!user) {
    return SIGN_IN_REQUIRED;
  }

  const result = await addItem(supabase, user.id, productId);

  if (result.ok) {
    revalidatePath("/", "layout");
  }

  return result;
}

export async function updateCartQuantity(
  itemId: string,
  quantity: number
): Promise<CartActionResult> {
  const { supabase, user } = await getSupabaseWithUser();

  if (!user) {
    return SIGN_IN_REQUIRED;
  }

  const result = await setItemQuantity(supabase, itemId, quantity);

  if (result.ok) {
    revalidatePath("/", "layout");
  }

  return result;
}

export async function removeFromCart(itemId: string): Promise<CartActionResult> {
  const { supabase, user } = await getSupabaseWithUser();

  if (!user) {
    return SIGN_IN_REQUIRED;
  }

  const result = await removeItem(supabase, itemId);

  if (result.ok) {
    revalidatePath("/", "layout");
  }

  return result;
}