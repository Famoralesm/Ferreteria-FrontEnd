export interface ProductSupplier {
  id: number;
  productoId: number;
  nombreProducto: string;
  proveedorId: number;
  nombreProveedor: string;
  telefonoProveedor?: string;
  emailProveedor?: string;
  precioCompra: number;
  seleccionado: boolean;
}

export interface ProductSupplierRequest {
  supplierId: number;
  purchasePrice: number;
  selected?: boolean;
}