import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyOrders, type CustomerOrderStatus } from "@/lib/data/orders";
import { formatNaira } from "@/lib/format";
import { formatOrderReference } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My orders",
};

const orderDateFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

const STATUS_BADGES: Record<
  CustomerOrderStatus,
  { label: string; variant: "default" | "destructive" }
> = {
  paid: { label: "Paid", variant: "default" },
  failed: { label: "Payment failed", variant: "destructive" },
};

function CenteredMessage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <CenteredMessage title="Sign in to see your orders">
        <SignInButton />
      </CenteredMessage>
    );
  }

  const orders = await getMyOrders();

  if (orders.length === 0) {
    return (
      <CenteredMessage title="No orders yet">
        <Package className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">
          When you place an order, it will show up here.
        </p>
        <Button asChild size="lg" className="h-11 px-6 text-base">
          <Link href="/">Start shopping</Link>
        </Button>
      </CenteredMessage>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <div className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to shop
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">My orders</h1>
      </div>

      <ul className="space-y-4">
        {orders.map((order) => {
          const badge = STATUS_BADGES[order.status];

          return (
            <li key={order.id} className="space-y-4 rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    Order <span className="font-mono">{formatOrderReference(order.id)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {orderDateFormatter.format(new Date(order.createdAt))}
                  </p>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>

              <ul className="divide-y text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 py-2">
                    <span>
                      {item.quantity} × {item.productName}
                    </span>
                    <span>{formatNaira(item.unitPriceKobo * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span>{formatNaira(order.totalKobo)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}