import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/types/shop";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductImage } from "./product-image";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden pt-0">
      <ProductImage
        name={product.name}
        imageUrl={product.imageUrl}
        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      />

      <CardContent className="flex flex-1 flex-col gap-2">
        <h2 className="leading-snug font-semibold">{product.name}</h2>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
        <p className="mt-auto pt-2 text-lg font-semibold">
          {formatNaira(product.priceKobo)}
        </p>
      </CardContent>

      <CardFooter>
        <AddToCartButton productId={product.id} productName={product.name} />
      </CardFooter>
    </Card>
  );
}