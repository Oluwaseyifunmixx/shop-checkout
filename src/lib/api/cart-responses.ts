import { NextResponse } from "next/server";
import type { CartResult } from "@/lib/cart-service";

export function unauthorized() {
  return NextResponse.json(
    { error: "Sign in to use your cart." },
    { status: 401 }
  );
}

// Turns a cart-service result into a JSON response with the right status code.
export function fromResult(result: CartResult) {
  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  const status = result.code === "INVALID_INPUT" ? 400 : 500;
  return NextResponse.json({ error: result.message }, { status });
}