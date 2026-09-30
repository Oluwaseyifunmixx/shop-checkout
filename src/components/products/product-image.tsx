import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductImageProps = {
  name: string;
  imageUrl: string | null;
  sizes: string;
  className?: string;
};

export function ProductImage({ name, imageUrl, sizes, className }: ProductImageProps) {
  if (!imageUrl) {
    return (
      <div
        aria-hidden="true"
        className={cn("grid aspect-square place-items-center bg-muted", className)}
      >
        <span className="text-6xl font-semibold text-muted-foreground/50">
          {name.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-square overflow-hidden bg-muted", className)}>
      <Image src={imageUrl} alt={name} fill sizes={sizes} className="object-cover" />
    </div>
  );
}