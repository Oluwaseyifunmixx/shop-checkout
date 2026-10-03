import { NextResponse } from "next/server";
import { getProducts } from "@/lib/data/products";

// Public endpoint: Row Level Security lets anyone view products, so no login
// is needed. The mobile app calls this to fill its shop screen.
export async function GET(request: Request) {
  try {
    const products = await getProducts();
    const origin = new URL(request.url).origin;

    return NextResponse.json({
      products: products.map((product) => ({
        ...product,
        // A phone can't use a path like "/products/bag.jpg": it has no site of
        // its own to resolve it against. Send a full address instead.
        imageUrl: product.imageUrl?.startsWith("/")
          ? `${origin}${product.imageUrl}`
          : product.imageUrl,
      })),
    });
  } catch (error) {
    console.error("[api:products]", error);
    return NextResponse.json(
      { error: "Could not load products." },
      { status: 500 }
    );
  }
}