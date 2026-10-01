import { createClient } from "@/lib/supabase/server";

export type CustomerOrderItem = {
  id: string;
  productName: string;
  unitPriceKobo: number;
  quantity: number;
};

export type CustomerOrderStatus = "paid" | "failed";

export type CustomerOrder = {
  id: string;
  status: CustomerOrderStatus;
  totalKobo: number;
  createdAt: string;
  items: CustomerOrderItem[];
};

type OrderRow = {
  id: string;
  status: CustomerOrderStatus;
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
// orders. Pending orders are left out: they're usually abandoned payment pages.
export async function getMyOrders(): Promise<CustomerOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, total_kobo, created_at, order_items(id, product_name, unit_price_kobo, quantity)"
    )
    .in("status", ["paid", "failed"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  return (data as unknown as OrderRow[]).map((row) => ({
    id: row.id,
    status: row.status,
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