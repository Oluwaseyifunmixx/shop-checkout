import { ProductImage } from "@/components/products/product-image";
import { Separator } from "@/components/ui/separator";
import { formatNaira } from "@/lib/format";
import type { CartItem } from "@/types/shop";

type OrderSummaryProps = {
  items: CartItem[];
  subtotalKobo: number;
};

export function OrderSummary({ items, subtotalKobo }: OrderSummaryProps) {
  return (
    <aside className="h-fit space-y-4 rounded-xl border bg-card p-5 lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold">Order summary</h2>

      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <ProductImage
              name={item.product.name}
              imageUrl={item.product.imageUrl}
              sizes="64px"
              className="size-16 shrink-0 rounded-md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.product.name}</p>
              <p className="text-sm text-muted-foreground">
                {item.quantity} × {formatNaira(item.product.priceKobo)}
              </p>
            </div>
            <p className="text-sm font-medium">
              {formatNaira(item.product.priceKobo * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <Separator />

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatNaira(subtotalKobo)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Delivery</dt>
          <dd>Free</dd>
        </div>
        <div className="flex justify-between pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatNaira(subtotalKobo)}</dd>
        </div>
      </dl>
    </aside>
  );
}