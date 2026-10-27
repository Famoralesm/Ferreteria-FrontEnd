export interface CreateCustomerRequest {

  rut: string;
  nombre: string;

  razonSocial: string;
  giro: string;
  tipoCompra: string;

  direccion: string;
  comuna: string;
  ciudad: string;

  contacto?: string;
  email: string;
  telefono: string;

  rutSolicita?: string;

  activo: boolean;
}