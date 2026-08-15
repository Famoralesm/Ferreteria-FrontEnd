export interface UpdateProductRequest {

  sku: string;

  name: string;

  description?: string;

  price: number;

  stock: number;

  active?: boolean;

  category?: string;

  brand?: string;

  unit?: string;
}