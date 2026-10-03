import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/types/shop";
import { PRODUCT_COLUMNS, toProduct, type ProductRow } from "./products";

type CartRow = {
  id: string;
  quantity: number;
  product: ProductRow | null;
};

// `client` lets API routes pass in a connection that carries a mobile user's
// token. The website passes nothing and gets the cookie-based connection.
export async function getCart(
  userId: string,
  client?: SupabaseClient
): Promise<CartItem[]> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("cart_items")
    .select(`id, quantity, product:products(${PRODUCT_COLUMNS})`)
    .eq("user_id", userId)
    .order("created_at");

  if (error) {
    throw new Error(`Failed to load cart: ${error.message}`);
  }

  return (data as unknown as CartRow[]).flatMap((row) =>
    row.product
      ? [{ id: row.id, quantity: row.quantity, product: toProduct(row.product) }]
      : []
  );
}