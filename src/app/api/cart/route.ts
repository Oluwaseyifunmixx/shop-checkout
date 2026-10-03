import { NextResponse } from "next/server";
import { fromResult, unauthorized } from "@/lib/api/cart-responses";
import { getCartTotals } from "@/lib/cart";
import { addItem } from "@/lib/cart-service";
import { getCart } from "@/lib/data/cart";
import { getRequestAuth } from "@/lib/supabase/request-auth";

export async function GET(request: Request) {
  const { supabase, user } = await getRequestAuth(request);

  if (!user) {
    return unauthorized();
  }

  try {
    const items = await getCart(user.id, supabase);
    const origin = new URL(request.url).origin;

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          // A phone needs full image addresses, not paths.
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

// Adds one of a product to the cart. Body: { "productId": "<uuid>" }
// Token only: the website adds to the cart through its own server actions.
export async function POST(request: Request) {
  const { supabase, user } = await getRequestAuth(request, {
    allowCookie: false,
  });

  if (!user) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const productId =
    body && typeof body === "object"
      ? (body as { productId?: unknown }).productId
      : undefined;

  return fromResult(await addItem(supabase, user.id, productId));
}