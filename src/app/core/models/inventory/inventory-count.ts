import { InventoryCountDetail } from './inventory-count-detail';

export type InventoryCountStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED';

export interface InventoryCount {
  id: number;
  descripcion: string;
  estado: InventoryCountStatus;
  sucursalId: number;
  nombreSucursal: string;
  fechaCreacion: string;
  iniciadoEn?: string;
  completadoEn?: string;
  detalles: InventoryCountDetail[];
}