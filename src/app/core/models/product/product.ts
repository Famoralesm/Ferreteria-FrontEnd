export interface Product {

  id: number;

  sku: string;

  name: string;

  description: string;

  price: number;

  wholesalePrice?: number | null;

  wholesaleMinQuantity?: number | null;

  stock: number;

  active: boolean;

  category: string;

  brand: string;

  unit: string;

  createdAt: string;

  updatedAt: string;

  imageUrl?: string | null;
}