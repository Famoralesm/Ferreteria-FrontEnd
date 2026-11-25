export interface ProductUnit {
  id: number;
  productId: number;
  code: string;
  name: string;
  conversionFactor: number;
  minimumSaleQuantity: number;
  saleQuantityIncrement: number;
  purchaseAllowed: boolean;
  saleAllowed: boolean;
  active: boolean;
}

export interface ProductUnitRequest {
  code: string;
  name: string;
  conversionFactor: number;
  minimumSaleQuantity: number;
  saleQuantityIncrement: number;
  purchaseAllowed: boolean;
  saleAllowed: boolean;
}
