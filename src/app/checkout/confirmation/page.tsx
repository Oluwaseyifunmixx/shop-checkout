import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { RefreshOnMount } from "@/components/checkout/refresh-on-mount";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { confirmOrderPayment, formatOrderReference } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Order confirmation",
};

const ACTION_BUTTON_CLASS = "h-11 px-6 text-base";

type ConfirmationPageProps = {
  searchParams: Promise<{ reference?: string }>;
};

type OrderItemRow = {
  id: string;
  product_name: string;
  unit_price_kobo: number;
  quantity: number;
};

function StatusCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
      {icon}
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {children}
    </div>
  );
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const { reference } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const confirmation = reference ? await confirmOrderPayment(reference) : null;

  if (!confirmation || !user || confirmation.order.user_id !== user.id) {
    return (
      <StatusCard
        icon={<CircleX className="size-12 text-muted-foreground" />}
        title="We couldn't find that order"
      >
        <Button asChild size="lg" className={ACTION_BUTTON_CLASS}>
          <Link href="/">Back to the shop</Link>
        </Button>
      </StatusCard>
    );
  }

  const { order } = confirmation;

  if (order.status === "failed") {
    return (
      <StatusCard
        icon={<CircleX className="size-12 text-destructive" />}
        title="Your payment didn't go through"
      >
        <p className="text-muted-foreground">
          You haven&rsquo;t been charged. Your cart is still saved, so you can try again.
        </p>
        <Button asChild size="lg" className={ACTION_BUTTON_CLASS}>
          <Link href="/checkout">Try again</Link>
        </Button>
      </StatusCard>
    );
  }

  if (order.status === "pending") {
    return (
      <StatusCard
        icon={<Clock className="size-12 text-muted-foreground" />}
        title="We're confirming your payment"
      >
        <p className="text-muted-foreground">
          This usually takes a moment. If you closed the payment page, your cart is still saved.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline" size="lg" className={ACTION_BUTTON_CLASS}>
            <Link href={`/checkout/confirmation?reference=${encodeURIComponent(reference ?? "")}`}>
              Check again
            </Link>
          </Button>
          <Button asChild size="lg" className={ACTION_BUTTON_CLASS}>
            <Link href="/checkout">Back to checkout</Link>
          </Button>
        </div>
      </StatusCard>
    );
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_name, unit_price_kobo, quantity")
    .eq("order_id", order.id);

  return (
    <StatusCard
      icon={<CircleCheck className="size-12 text-green-600" />}
      title="Thank you for your order!"
    >
      <RefreshOnMount />

      <p className="text-muted-foreground">
        We&rsquo;ve received your payment of{" "}
        <strong className="text-foreground">{formatNaira(order.total_kobo)}</strong>.
      </p>

      <ul className="w-full divide-y rounded-xl border text-left">
        {((items ?? []) as OrderItemRow[]).map((item) => (
          <li key={item.id} className="flex justify-between gap-4 p-4 text-sm">
            <span>
              {item.quantity} × {item.product_name}
            </span>
            <span className="font-medium">
              {formatNaira(item.unit_price_kobo * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted-foreground">
        Order reference:{" "}
        <span className="font-mono">{formatOrderReference(order.id)}</span>
        <br />
        A confirmation email is on its way to {order.email}.
      </p>

      <Button asChild size="lg" className={ACTION_BUTTON_CLASS}>
        <Link href="/">Continue shopping</Link>
      </Button>
    </StatusCard>
  );
}