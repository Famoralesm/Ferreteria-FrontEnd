export type PurchaseStatus = 'PENDING_RECEIPT' | 'RECEIVED' | 'CANCELED';

export interface PurchaseItemRequest {
  productId: number;
  productUnitId: number | null;
  quantity: number;
  unitPurchasePrice: number;
}

export interface PurchaseRequest {
  supplierId: number;
  sucursalId: number;
  documentType?: string | null;
  documentNumber?: string | null;
  purchaseDate: string;
  notes?: string | null;
  items: PurchaseItemRequest[];
}

export interface PurchaseItem {
  id: number;
  productId: number;
  productUnitId: number | null;
  productSku: string;
  productName: string;
  unitCode: string;
  unitName: string;
  conversionFactor: number;
  quantity: number;
  quantityBaseUnit: number;
  unitPurchasePrice: number;
  subtotal: number;
}

export interface Purchase {
  id: number;
  supplierId: number;
  supplierName: string;
  sucursalId: number;
  documentType: string | null;
  documentNumber: string | null;
  purchaseDate: string;
  status: PurchaseStatus;
  total: number;
  notes: string | null;
  createdById: number | null;
  receivedById: number | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseItem[];
}