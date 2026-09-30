"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getCartTotals } from "@/lib/cart";
import { formatNaira } from "@/lib/format";
import type { CartItem } from "@/types/shop";
import { CartLine } from "./cart-line";

type CartSheetProps = {
  items: CartItem[];
};

export function CartSheet({ items }: CartSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { itemCount, subtotalKobo } = getCartTotals(items);
  const itemLabel = `${itemCount} item${itemCount === 1 ? "" : "s"}`;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Open cart, ${itemLabel}`}
        >
          <ShoppingBag className="size-5" />
          {itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
          <SheetDescription>
            {itemCount === 0 ? "Your cart is empty." : itemLabel}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nothing here yet.</p>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Keep shopping
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-5 overflow-y-auto px-4">
              {items.map((item) => (
                <CartLine key={item.id} item={item} />
              ))}
            </ul>

            <SheetFooter className="border-t">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span>{formatNaira(subtotalKobo)}</span>
              </div>
              <Button asChild size="lg" className="h-11 w-full text-base">
                <Link href="/checkout" onClick={() => setIsOpen(false)}>
                  Checkout
                </Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}