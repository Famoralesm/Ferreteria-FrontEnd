export interface CreateOrderItemRequest {
  // Puede ser null para conservar líneas históricas o productos personalizados.
  productId: number | null;
  productName?: string;
  unitId?: number | null;
  quantity: number;
  unitPrice?: number;
}