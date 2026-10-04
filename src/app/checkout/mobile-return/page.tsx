import type { Metadata } from "next";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmOrderPayment, formatOrderReference } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Payment status",
  robots: { index: false, follow: false },
};

// Asks Android to bring Expo Go (and so the Crafted app) back to the front. It
// is an experiment: the page also tells shoppers how to go back by hand.
const OPEN_APP_HREF =
  "intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=host.exp.exponent;end";

type MobileReturnPageProps = {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
};

type Outcome = "paid" | "pending" | "failed" | "unknown";

type Result = { outcome: Outcome; orderReference?: string };

async function getResult(reference: string | undefined): Promise<Result> {
  if (!reference) {
    return { outcome: "unknown" };
  }

  try {
    const confirmation = await confirmOrderPayment(reference);

    if (!confirmation) {
      return { outcome: "unknown" };
    }

    return {
      outcome: confirmation.order.status,
      orderReference: formatOrderReference(confirmation.order.id),
    };
  } catch (error) {
    console.error("[checkout:mobile-return] Failed to confirm payment:", error);
    // Not final: the app can re-check the order from its Orders tab.
    return { outcome: "pending" };
  }
}

const CONTENT: Record<
  Outcome,
  { icon: React.ReactNode; title: string; body: string }
> = {
  paid: {
    icon: <CircleCheck className="size-12 text-green-600" />,
    title: "Payment received",
    body: "Thank you! Your order is confirmed. Go back to the Crafted app to see it.",
  },
  pending: {
    icon: <Clock className="size-12 text-muted-foreground" />,
    title: "We're confirming your payment",
    body: "Go back to the Crafted app and tap \"I've paid, check my payment\".",
  },
  failed: {
    icon: <CircleX className="size-12 text-destructive" />,
    title: "Your payment didn't go through",
    body: "You haven't been charged. Go back to the Crafted app, where your cart is still saved, and try again.",
  },
  unknown: {
    icon: <CircleX className="size-12 text-muted-foreground" />,
    title: "We couldn't find that payment",
    body: "Go back to the Crafted app and open the Orders tab to check.",
  },
};

export default async function MobileReturnPage({
  searchParams,
}: MobileReturnPageProps) {
  const { reference, trxref } = await searchParams;
  const { outcome, orderReference } = await getResult(reference ?? trxref);
  const content = CONTENT[outcome];

  return (
    // Covers the whole screen, including the site header: this page is only for
    // phones coming back from Paystack, and the header's Sign in button would
    // only confuse them.
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 text-center">
        {content.icon}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {content.title}
        </h1>
        <p className="text-muted-foreground">{content.body}</p>
        {orderReference && (
          <p className="text-sm text-muted-foreground">
            Order reference: <span className="font-mono">{orderReference}</span>
          </p>
        )}

        <Button asChild size="lg" className="h-11 px-6 text-base">
          <a href={OPEN_APP_HREF}>Back to the Crafted app</a>
        </Button>

        <p className="text-sm text-muted-foreground">
          If the button does nothing, press your phone&rsquo;s back button, or
          open the Crafted app from your recent apps.
        </p>
      </div>
    </div>
  );
}