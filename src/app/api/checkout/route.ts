import { NextResponse } from "next/server";
import { createCheckout, type CheckoutErrorCode } from "@/lib/checkout-service";
import { getRequestAuth } from "@/lib/supabase/request-auth";

const STATUS_BY_CODE: Record<CheckoutErrorCode, number> = {
  SIGN_IN_REQUIRED: 401,
  INVALID_INPUT: 400,
  EMPTY_CART: 400,
  SERVER_ERROR: 500,
};

// Starts a payment for the signed-in shopper's cart. Body: the delivery details
// (fullName, phone, address, city, state). Token only: the website starts
// checkout through its own server action.
export async function POST(request: Request) {
  const { supabase, user } = await getRequestAuth(request, {
    allowCookie: false,
  });

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to check out." },
      { status: 401 }
    );
  }

  const input = await request.json().catch(() => null);

  try {
    const result = await createCheckout({
      supabase,
      user,
      input,
      // The phone's browser has no website login, so after paying it lands on
      // a small page that only reports the result.
      callbackUrl: `${new URL(request.url).origin}/checkout/mobile-return`,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message },
        { status: STATUS_BY_CODE[result.code] }
      );
    }

    return NextResponse.json({
      paymentUrl: result.paymentUrl,
      orderId: result.orderId,
    });
  } catch (error) {
    console.error("[api:checkout]", error);
    return NextResponse.json(
      { error: "We couldn't start your payment. Please try again." },
      { status: 500 }
    );
  }
}