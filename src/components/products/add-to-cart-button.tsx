"use client";

import { useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/app/actions/cart";
import { startGoogleSignIn } from "@/lib/auth/sign-in";

type AddToCartButtonProps = {
  productId: string;
  productName: string;
};

export function AddToCartButton({ productId, productName }: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await addToCart(productId);

      if (result.ok) {
        toast.success(`${productName} added to your cart`);
        return;
      }

      if (result.code === "SIGN_IN_REQUIRED") {
        toast("Sign in to start shopping", {
          description: "Your cart is saved to your account.",
          action: {
            label: "Sign in",
            onClick: () => void startGoogleSignIn(window.location.pathname),
          },
        });
        return;
      }

      toast.error(result.message);
    });
  }

  return (
    <Button
      size="lg"
      onClick={handleClick}
      disabled={isPending}
      className="h-11 w-full text-base"
    >
      <ShoppingBag />
      {isPending ? "Adding…" : "Add to cart"}
    </Button>
  );
}