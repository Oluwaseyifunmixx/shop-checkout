import { ProductCard } from "@/components/products/product-card";
import { getProducts } from "@/lib/data/products";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Handmade goods, delivered
        </h1>
        <p className="text-muted-foreground">
          Everyday pieces from independent Nigerian makers.
        </p>
      </div>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}