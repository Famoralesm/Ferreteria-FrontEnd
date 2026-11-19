export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  price: number;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;
  stock: number;
  active?: boolean;
  category?: string;
  brand?: string;
  unit?: string;
}