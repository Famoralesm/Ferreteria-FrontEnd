import { MovementType } from './movement-type';

export interface InventoryMovementRequest {
  productoId: number;
  sucursalId?: number;
  cantidad: number;
  motivo?: string;
  tipoReferencia?: string;
  referenciaId?: number;
}

