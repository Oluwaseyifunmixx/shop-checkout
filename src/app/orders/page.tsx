import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  Clock,
  Package,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyOrders, type CustomerOrderStatus } from "@/lib/data/orders";
import { formatNaira } from "@/lib/format";
import { formatOrderReference } from "@/lib/orders";
import { cn } from "@/lib/utils";
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
  { label: string; icon: LucideIcon; className: string }
> = {
  paid: {
    label: "Paid",
    icon: CircleCheck,
    className: "border-green-200 bg-green-100 text-green-800",
  },
  pending: {
    label: "Awaiting payment",
    icon: Clock,
    className: "border-amber-200 bg-amber-100 text-amber-800",
  },
  failed: {
    label: "Payment failed",
    icon: CircleX,
    className: "border-red-200 bg-red-100 text-red-800",
  },
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
          const BadgeIcon = badge.icon;

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
                <Badge
                  variant="outline"
                  className={cn("gap-1.5 px-3 py-1 text-sm font-medium", badge.className)}
                >
                  <BadgeIcon className="size-4" />
                  {badge.label}
                </Badge>
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

              {order.status === "pending" && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 p-3">
                  <p className="text-sm text-amber-900">
                    Already paid? Check with Paystack to update this order.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/checkout/verify?reference=${encodeURIComponent(order.paymentReference)}`}
                    >
                      <RefreshCw />
                      Check payment status
                    </Link>
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}