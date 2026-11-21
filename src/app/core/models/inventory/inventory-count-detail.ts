export interface InventoryCountDetail {
  id: number;
  productoId: number;
  sku: string;
  nombreProducto: string;
  stockEsperado: number;
  stockContado?: number;
  diferencia?: number;
  observaciones?: string;
  ajusteAplicado: boolean;
}