export interface Dashboard {
  ventasHoy: number;
  pedidosPendientes: number;
  clientes: number;
  productos: number;
}

export interface DashboardOrderStatus {
  total: number;
  created: number;
  preparing: number;
  inRoute: number;
  delivered: number;
  rejected: number;
  canceled: number;
}

export interface DashboardProductStatus {
  active: number;
  inactive: number;
  lowStock: number;
  total: number;
}
