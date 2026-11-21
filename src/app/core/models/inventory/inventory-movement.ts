export type MovementType =
  | 'INITIAL'
  | 'ENTRY'
  | 'EXIT'
  | 'ADJUSTMENT'
  | 'RETURN';

export interface InventoryMovement {
  id: number;
  productoId: number;
  sku: string;
  nombreProducto: string;
  tipoMovimiento: MovementType;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo?: string;
  tipoReferencia?: string;
  referenciaId?: number;
  usuario?: string;
  fechaCreacion: string;
  sucursalId: number;
  nombreSucursal: string;
}