"use server";

import { headers } from "next/headers";
import { getCartTotals } from "@/lib/cart";
import { getCart } from "@/lib/data/cart";
import { initializeTransaction } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout";

export type CheckoutResult =
  | { ok: true; paymentUrl: string }
  | { ok: false; message: string };

const GENERIC_ERROR = "We couldn't start your payment. Please try again.";

export async function startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Please check your delivery details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, message: "Please sign in to check out." };
  }

  const cart = await getCart(user.id);

  if (cart.length === 0) {
    return { ok: false, message: "Your cart is empty." };
  }

  // The total always comes from database prices, never from the browser.
  const { subtotalKobo } = getCartTotals(cart);
  const reference = `crafted_${crypto.randomUUID()}`;
  const admin = createAdminClient();
  const details = parsed.data;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      total_kobo: subtotalKobo,
      email: user.email,
      full_name: details.fullName,
      phone: details.phone,
      address: details.address,
      city: details.city,
      state: details.state,
      payment_reference: reference,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[checkout:start] Failed to create order:", orderError);
    return { ok: false, message: GENERIC_ERROR };
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    cart.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      unit_price_kobo: item.product.priceKobo,
      quantity: item.quantity,
    }))
  );

  if (itemsError) {
    console.error("[checkout:start] Failed to save order items:", itemsError);
    await admin.from("orders").delete().eq("id", order.id);
    return { ok: false, message: GENERIC_ERROR };
  }

  try {
    const origin = (await headers()).get("origin") ?? "http://localhost:3000";
    const payment = await initializeTransaction({
      email: user.email,
      amountKobo: subtotalKobo,
      reference,
      callbackUrl: `${origin}/checkout/verify`,
      metadata: { order_id: order.id },
    });

    return { ok: true, paymentUrl: payment.authorization_url };
  } catch (error) {
    console.error("[checkout:start] Failed to start Paystack payment:", error);
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return { ok: false, message: GENERIC_ERROR };
  }
}