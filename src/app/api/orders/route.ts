import { NextResponse } from "next/server";
import { getMyOrders } from "@/lib/data/orders";
import { formatOrderReference } from "@/lib/orders";
import { getRequestAuth } from "@/lib/supabase/request-auth";

// The signed-in shopper's orders, for the mobile app. Works with the website's
// cookie or a mobile login token, and Row Level Security means a shopper can
// only ever see their own orders.
export async function GET(request: Request) {
  const { supabase, user } = await getRequestAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to see your orders." },
      { status: 401 }
    );
  }

  try {
    const orders = await getMyOrders(supabase);

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: order.id,
        // The same display reference the website's My orders page shows.
        reference: formatOrderReference(order.id),
        status: order.status,
        totalKobo: order.totalKobo,
        createdAt: order.createdAt,
        items: order.items,
      })),
    });
  } catch (error) {
    console.error("[api:orders]", error);
    return NextResponse.json(
      { error: "Could not load your orders." },
      { status: 500 }
    );
  }
}