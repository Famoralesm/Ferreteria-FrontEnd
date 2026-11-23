export interface ProductStock {
  id: number;
  productoId: number;
  sku: string;
  nombreProducto: string;
  categoria?: string;
  marca?: string;
  sucursalId: number;
  nombreSucursal: string;
  stock: number;
  stockMinimo: number;
  bajoStock: boolean;
  inventarioInicialRegistrado?: boolean;
  tieneMovimientos?: boolean;
  fechaActualizacion?: string;
}
