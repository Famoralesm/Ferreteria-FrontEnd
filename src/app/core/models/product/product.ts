export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string | null;

  price: number;
  wholesalePrice?: number | null;
  wholesaleMinQuantity?: number | null;
  minimumSaleQuantity?: number;
  saleQuantityIncrement?: number;

  stock: number;
  stockMinimo?: number;
  active: boolean;
  category?: string | null;
  brand?: string | null;
  unit?: string | null;
  baseUnitId?: number | null;
  baseUnitCode?: string | null;
  baseUnitName?: string | null;
  baseUnitSymbol?: string | null;

  createdAt?: string;
  updatedAt?: string;
  imageUrl?: string | null;
  
}