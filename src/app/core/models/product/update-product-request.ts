export interface UpdateProductRequest {
  sku: string;
  name: string;
  description?: string;
  price: number;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;
  minimumSaleQuantity: number;
  saleQuantityIncrement: number;
  active: boolean;
  category?: string;
  brand?: string;
}