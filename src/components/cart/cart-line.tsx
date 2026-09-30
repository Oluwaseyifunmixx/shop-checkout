"use client";

import { useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/products/product-image";
import {
  removeFromCart,
  updateCartQuantity,
  type CartActionResult,
} from "@/app/actions/cart";
import { MAX_QUANTITY } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types/shop";

type CartLineProps = {
  item: CartItem;
};

export function CartLine({ item }: CartLineProps) {
  const [isPending, startTransition] = useTransition();
  const { product, quantity } = item;

  function runAction(action: () => Promise<CartActionResult>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.message);
      }
    });
  }

  return (
    <li className={cn("flex gap-3 transition-opacity", isPending && "opacity-60")}>
      <ProductImage
        name={product.name}
        imageUrl={product.imageUrl}
        sizes="80px"
        className="size-20 shrink-0 rounded-md"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="leading-snug font-medium">{product.name}</p>
          <p className="shrink-0 font-medium">
            {formatNaira(product.priceKobo * quantity)}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatNaira(product.priceKobo)} each
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Decrease quantity of ${product.name}`}
              disabled={isPending || quantity <= 1}
              onClick={() => runAction(() => updateCartQuantity(item.id, quantity - 1))}
            >
              <Minus />
            </Button>
            <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Increase quantity of ${product.name}`}
              disabled={isPending || quantity >= MAX_QUANTITY}
              onClick={() => runAction(() => updateCartQuantity(item.id, quantity + 1))}
            >
              <Plus />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled={isPending}
            onClick={() => runAction(() => removeFromCart(item.id))}
          >
            <Trash2 />
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
}