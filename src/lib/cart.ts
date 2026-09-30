import type { CartItem } from "@/types/shop";

export const MAX_QUANTITY = 20;

export function getCartTotals(items: CartItem[]) {
  return items.reduce(
    (totals, item) => ({
      itemCount: totals.itemCount + item.quantity,
      subtotalKobo: totals.subtotalKobo + item.quantity * item.product.priceKobo,
    }),
    { itemCount: 0, subtotalKobo: 0 }
  );
}