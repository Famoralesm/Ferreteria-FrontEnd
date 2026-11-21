export interface Supplier {
  id: number;
  rut?: string;
  nombre: string;
  razonSocial?: string;
  giro?: string;
  direccion?: string;
  comuna?: any;
  ciudad?: any;
  telefono?: string;
  email?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}