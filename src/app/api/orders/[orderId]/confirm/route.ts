import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmOrderPayment } from "@/lib/orders";
import { getRequestAuth } from "@/lib/supabase/request-auth";

type RouteContext = { params: Promise<{ orderId: string }> };

const orderIdSchema = z.uuid();

// Re-checks an order's payment with Paystack, for a shopper who paid but never
// came back to the app. Safe to call repeatedly: confirmOrderPayment only marks
// an order paid once, so the cart is emptied and the email is sent once.
// Token only, like the other routes that change data.
export async function POST(request: Request, { params }: RouteContext) {
  const { supabase, user } = await getRequestAuth(request, {
    allowCookie: false,
  });

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to check an order." },
      { status: 401 }
    );
  }

  const { orderId } = await params;
  const parsedId = orderIdSchema.safeParse(orderId);

  if (!parsedId.success) {
    return NextResponse.json(
      { error: "That order id isn't valid." },
      { status: 400 }
    );
  }

  try {
    // Read through the shopper's own client: Row Level Security only returns
    // their own orders, so this doubles as the ownership check.
    const { data: order, error } = await supabase
      .from("orders")
      .select("payment_reference")
      .eq("id", parsedId.data)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load order: ${error.message}`);
    }

    if (!order) {
      return NextResponse.json(
        { error: "We couldn't find that order." },
        { status: 404 }
      );
    }

    const confirmation = await confirmOrderPayment(
      order.payment_reference as string
    );

    if (!confirmation) {
      return NextResponse.json(
        { error: "We couldn't find that order." },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: confirmation.order.status });
  } catch (error) {
    console.error("[api:orders:confirm]", error);
    return NextResponse.json(
      { error: "We couldn't check that payment. Please try again." },
      { status: 500 }
    );
  }
}