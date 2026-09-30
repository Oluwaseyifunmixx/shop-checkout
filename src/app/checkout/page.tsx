import type { Metadata } from "next";
import Link from "next/link";
import { SignInButton } from "@/components/auth/sign-in-button";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Button } from "@/components/ui/button";
import { getCartTotals } from "@/lib/cart";
import { getCart } from "@/lib/data/cart";
import { formatNaira } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Checkout",
};

function CenteredMessage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return (
      <CenteredMessage title="Sign in to check out">
        <p className="text-muted-foreground">
          We&rsquo;ll use your Google account to save your order and send your confirmation.
        </p>
        <SignInButton />
      </CenteredMessage>
    );
  }

  const cart = await getCart(user.id);

  if (cart.length === 0) {
    return (
      <CenteredMessage title="Your cart is empty">
        <p className="text-muted-foreground">Add something you love, then come back here.</p>
        <Button asChild>
          <Link href="/">Browse products</Link>
        </Button>
      </CenteredMessage>
    );
  }

  const { subtotalKobo } = getCartTotals(cart);
  const defaultName = (user.user_metadata.full_name as string | undefined) ?? "";

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
      <OrderSummary items={cart} subtotalKobo={subtotalKobo} />

      <section className="space-y-6 lg:order-first">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
          <p className="text-muted-foreground">
            Enter your delivery details, then pay securely with Paystack.
          </p>
        </div>
        <CheckoutForm
          email={user.email}
          defaultName={defaultName}
          totalLabel={formatNaira(subtotalKobo)}
        />
      </section>
    </div>
  );
}