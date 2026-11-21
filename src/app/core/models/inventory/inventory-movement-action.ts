import { MovementType } from './movement-type';
import { InventoryMovementRequest } from './inventory-movement-request';

export interface InventoryMovementAction {
  type: Exclude<MovementType, 'INITIAL' | 'RETURN'>;
  request: InventoryMovementRequest;
}