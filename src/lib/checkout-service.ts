import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getCartTotals } from "@/lib/cart";
import { getCart } from "@/lib/data/cart";
import { initializeTransaction } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSchema } from "@/lib/validations/checkout";

export type CreateCheckoutResult =
  | { ok: true; paymentUrl: string; reference: string }
  | { ok: false; message: string };

const GENERIC_ERROR = "We couldn't start your payment. Please try again.";

type CreateCheckoutParams = {
  // A client that acts as the signed-in user, so their own cart is read under
  // Row Level Security (a cookie client on the website, a token client for the app).
  supabase: SupabaseClient;
  user: User;
  // Delivery details from the shopper. Validated here, so callers can pass them as they arrive.
  input: unknown;
  // Where Paystack sends the shopper after paying. The website and the mobile
  // app use different pages.
  callbackUrl: string;
};

// Creates a pending order from the shopper's cart and starts a Paystack
// payment for it. Shared by the website's server action and the mobile API.
export async function createCheckout({
  supabase,
  user,
  input,
  callbackUrl,
}: CreateCheckoutParams): Promise<CreateCheckoutResult> {
  if (!user.email) {
    return { ok: false, message: "Please sign in to check out." };
  }

  const parsed = checkoutSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Please check your delivery details." };
  }

  const cart = await getCart(user.id, supabase);

  if (cart.length === 0) {
    return { ok: false, message: "Your cart is empty." };
  }

  // The total always comes from database prices, never from the caller.
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
    const payment = await initializeTransaction({
      email: user.email,
      amountKobo: subtotalKobo,
      reference,
      callbackUrl,
      metadata: { order_id: order.id },
    });

    return { ok: true, paymentUrl: payment.authorization_url, reference };
  } catch (error) {
    console.error("[checkout:start] Failed to start Paystack payment:", error);
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return { ok: false, message: GENERIC_ERROR };
  }
}