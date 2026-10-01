import "server-only";
import { buildOrderConfirmationEmail } from "@/lib/emails/order-confirmation";
import { sendEmail } from "@/lib/mailgun";
import { verifyTransaction } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";

export type OrderStatus = "pending" | "paid" | "failed";

export type OrderRecord = {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_kobo: number;
  email: string;
  full_name: string;
  address: string;
  city: string;
  state: string;
  created_at: string;
};

const ORDER_COLUMNS =
  "id, user_id, status, total_kobo, email, full_name, address, city, state, created_at";

export type PaymentConfirmation = {
  order: OrderRecord;
  justPaid: boolean;
};

type OrderItemRow = {
  product_name: string;
  unit_price_kobo: number;
  quantity: number;
};

export function formatOrderReference(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

async function sendOrderConfirmationEmail(order: OrderRecord): Promise<void> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("order_items")
    .select("product_name, unit_price_kobo, quantity")
    .eq("order_id", order.id);

  if (error) {
    throw new Error(`Failed to load order items: ${error.message}`);
  }

  const email = buildOrderConfirmationEmail({
    customerName: order.full_name,
    orderReference: formatOrderReference(order.id),
    totalKobo: order.total_kobo,
    items: (data as OrderItemRow[]).map((item) => ({
      name: item.product_name,
      quantity: item.quantity,
      unitPriceKobo: item.unit_price_kobo,
    })),
    address: order.address,
    city: order.city,
    state: order.state,
  });

  await sendEmail({ to: order.email, ...email });
}

// Safe to call more than once for the same reference (for example, if the
// shopper refreshes the confirmation page): only the first call that sees a
// successful payment marks the order paid, so follow-up work happens once.
export async function confirmOrderPayment(
  reference: string
): Promise<PaymentConfirmation | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("payment_reference", reference)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load order: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const order = data as OrderRecord;

  if (order.status !== "pending") {
    return { order, justPaid: false };
  }

  const transaction = await verifyTransaction(reference);

  if (transaction.status === "failed") {
    await admin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", order.id)
      .eq("status", "pending");

    return { order: { ...order, status: "failed" }, justPaid: false };
  }

  const isPaidInFull =
    transaction.status === "success" &&
    transaction.amount === order.total_kobo &&
    transaction.currency === "NGN";

  if (!isPaidInFull) {
    if (transaction.status === "success") {
      console.error("[orders:confirm] Amount or currency mismatch", {
        reference,
        expected: order.total_kobo,
        received: transaction.amount,
        currency: transaction.currency,
      });
    }
    return { order, justPaid: false };
  }

  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id");

  if (updateError) {
    throw new Error(`Failed to mark order as paid: ${updateError.message}`);
  }

  const justPaid = (updated?.length ?? 0) > 0;
  const paidOrder: OrderRecord = { ...order, status: "paid" };

  if (justPaid) {
    // The shopper has paid for what was in their cart, so start them fresh.
    const { error: cartError } = await admin
      .from("cart_items")
      .delete()
      .eq("user_id", order.user_id);

    if (cartError) {
      console.error("[orders:confirm] Failed to clear cart:", cartError);
    }

    // A failed email must never undo a successful payment, so we log it
    // instead of throwing. The order stays paid either way.
    try {
      await sendOrderConfirmationEmail(paidOrder);
    } catch (emailError) {
      console.error("[orders:confirm] Failed to send confirmation email:", emailError);
    }
  }

  return { order: paidOrder, justPaid };
}