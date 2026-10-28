export interface CustomerReference {
  id: number;
}

export interface CreateCustomerRequest {
  rut: string;
  nombre: string;
  razonSocial?: string;
  giro?: string;
  direccion?: string;

  ciudad: CustomerReference;
  comuna: CustomerReference;

  email?: string;
  telefono?: string;
  activo: boolean;
}