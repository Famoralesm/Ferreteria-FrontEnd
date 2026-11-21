import { MovementType } from './inventory-movement';

export interface InventoryMovementRequest {
  productoId: number;
  sucursalId?: number;
  cantidad: number;
  motivo?: string;
  tipoReferencia?: string;
  referenciaId?: number;
}

export interface InventoryMovementAction {
  type: Exclude<MovementType, 'INITIAL' | 'RETURN'>;
  request: InventoryMovementRequest;
}