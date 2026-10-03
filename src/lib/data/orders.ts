import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type CustomerOrderItem = {
  id: string;
  productName: string;
  unitPriceKobo: number;
  quantity: number;
};

export type CustomerOrderStatus = "paid" | "failed" | "pending";

export type CustomerOrder = {
  id: string;
  status: CustomerOrderStatus;
  paymentReference: string;
  totalKobo: number;
  createdAt: string;
  items: CustomerOrderItem[];
};

type OrderRow = {
  id: string;
  status: CustomerOrderStatus;
  payment_reference: string;
  total_kobo: number;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    unit_price_kobo: number;
    quantity: number;
  }[];
};

// Uses the shopper's own session, so Row Level Security only returns their
// orders. Pending orders are included so shoppers can re-check a payment, for
// example if they paid but closed the tab before returning to the shop.
// `client` lets API routes pass in a connection that carries a mobile user's
// token. The website passes nothing and gets the cookie-based connection.
export async function getMyOrders(
  client?: SupabaseClient
): Promise<CustomerOrder[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, payment_reference, total_kobo, created_at, order_items(id, product_name, unit_price_kobo, quantity)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  return (data as unknown as OrderRow[]).map((row) => ({
    id: row.id,
    status: row.status,
    paymentReference: row.payment_reference,
    totalKobo: row.total_kobo,
    createdAt: row.created_at,
    items: row.order_items.map((item) => ({
      id: item.id,
      productName: item.product_name,
      unitPriceKobo: item.unit_price_kobo,
      quantity: item.quantity,
    })),
  }));
}