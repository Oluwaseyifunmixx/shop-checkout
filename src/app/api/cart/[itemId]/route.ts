import { fromResult, unauthorized } from "@/lib/api/cart-responses";
import { removeItem, setItemQuantity } from "@/lib/cart-service";
import { getRequestAuth } from "@/lib/supabase/request-auth";

type RouteContext = { params: Promise<{ itemId: string }> };

// Sets an item's quantity. Body: { "quantity": 3 }
export async function PATCH(request: Request, { params }: RouteContext) {
  const { supabase, user } = await getRequestAuth(request);

  if (!user) {
    return unauthorized();
  }

  const { itemId } = await params;
  const body = await request.json().catch(() => null);
  const quantity =
    body && typeof body === "object"
      ? (body as { quantity?: unknown }).quantity
      : undefined;

  return fromResult(await setItemQuantity(supabase, itemId, quantity));
}

// Removes an item from the cart.
export async function DELETE(request: Request, { params }: RouteContext) {
  const { supabase, user } = await getRequestAuth(request);

  if (!user) {
    return unauthorized();
  }

  const { itemId } = await params;

  return fromResult(await removeItem(supabase, itemId));
}