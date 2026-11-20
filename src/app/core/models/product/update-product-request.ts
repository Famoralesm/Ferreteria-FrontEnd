export interface UpdateProductRequest {
  sku: string;
  name: string;
  description?: string;
  price: number;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;
  active: boolean;
  category?: string;
  brand?: string;
  unit?: string;
}