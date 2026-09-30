import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/shop";

export type ProductRow = {
  id: string;
  name: string;
  description: string;
  price_kobo: number;
  image_url: string | null;
};

export const PRODUCT_COLUMNS = "id, name, description, price_kobo, image_url";

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceKobo: row.price_kobo,
    imageUrl: row.image_url,
  };
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("name");

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return (data as ProductRow[]).map(toProduct);
}