export type Product = {
  id: string;
  name: string;
  description: string;
  priceKobo: number;
  imageUrl: string | null;
};

export type CartItem = {
  id: string;
  quantity: number;
  product: Product;
};