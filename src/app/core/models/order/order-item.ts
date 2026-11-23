export interface OrderItem {
  id?: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitId?: number | null;
  unitCode?: string;
  unitName?: string;
  conversionFactor?: number;
  quantityInBaseUnit?: number;
  unitPrice: number;
  totalPrice: number;
  wholesaleApplied?: boolean;
  pricingType?: string;
}