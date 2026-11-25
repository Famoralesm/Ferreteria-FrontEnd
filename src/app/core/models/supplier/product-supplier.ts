export interface ProductSupplier {
  id: number;
  productoId: number;
  nombreProducto: string;
  proveedorId: number;
  nombreProveedor: string;
  telefonoProveedor?: string;
  emailProveedor?: string;
  precioCompra: number;
  marcaId?: number | null;
  nombreMarca?: string | null;
  presentacionId?: number | null;
  codigoPresentacion?: string | null;
  nombrePresentacion?: string | null;
  factorConversion?: number;
  precioUnidadBase?: number;
  unidadBaseProducto?: string | null;
  seleccionado: boolean;
}

export interface ProductSupplierRequest {
  supplierId: number;
  brandId: number;
  productUnitId: number;
  purchasePrice: number;
  selected?: boolean;
}