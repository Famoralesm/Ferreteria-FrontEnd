export type OrderStatus =
  | 'CREATED'
  | 'IN_ROUTE'
  | 'DELIVERED'
  | 'PREPARING'
  | 'REJECTED'
  | 'CANCELED';

export interface OrderStatusOption {
  label: string;
  value: OrderStatus;
}

export const ORDER_STATUSES: OrderStatusOption[] = [
  {
    label: 'Creado',
    value: 'CREATED'
  },
  {
    label: 'En ruta',
    value: 'IN_ROUTE'
  },
  {
    label: 'Entregado',
    value: 'DELIVERED'
  },
  {
    label: 'Preparando',
    value: 'PREPARING'
  },
  {
    label: 'Rechazado',
    value: 'REJECTED'
  },
  {
    label: 'Cancelado',
    value: 'CANCELED'
  }
];