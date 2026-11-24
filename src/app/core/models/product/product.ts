export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string | null;

  price: number;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;

  stock: number;
  stockMinimo?: number;
  active: boolean;
  category?: string | null;
  brand?: string | null;
  unit?: string | null;

  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string | null;
  
}