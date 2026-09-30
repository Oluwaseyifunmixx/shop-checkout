import { NextResponse, type NextRequest } from "next/server";
import { confirmOrderPayment } from "@/lib/orders";

// Paystack sends shoppers here after paying. We confirm the payment (and empty
// the cart) before showing the confirmation page, so every part of that page,
// including the cart badge in the header, loads with the finished state.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const reference = searchParams.get("reference");

  if (reference) {
    try {
      await confirmOrderPayment(reference);
    } catch (error) {
      // The confirmation page checks again, so a failure here isn't final.
      console.error("[checkout:verify] Failed to confirm payment:", error);
    }
  }

  const confirmationUrl = new URL("/checkout/confirmation", origin);

  if (reference) {
    confirmationUrl.searchParams.set("reference", reference);
  }

  return NextResponse.redirect(confirmationUrl);
}