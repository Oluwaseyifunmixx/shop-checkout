import { NextResponse } from "next/server";
import { getCart } from "@/lib/data/cart";
import { getCartTotals } from "@/lib/cart";
import { getRequestAuth } from "@/lib/supabase/request-auth";

export async function GET(request: Request) {
  const { supabase, user } = await getRequestAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to use your cart." },
      { status: 401 }
    );
  }

  try {
    const items = await getCart(user.id, supabase);
    const origin = new URL(request.url).origin;

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          // Same reason as in the products endpoint: a phone needs full addresses.
          imageUrl: item.product.imageUrl?.startsWith("/")
            ? `${origin}${item.product.imageUrl}`
            : item.product.imageUrl,
        },
      })),
      totals: getCartTotals(items),
    });
  } catch (error) {
    console.error("[api:cart]", error);
    return NextResponse.json(
      { error: "Could not load your cart." },
      { status: 500 }
    );
  }
}