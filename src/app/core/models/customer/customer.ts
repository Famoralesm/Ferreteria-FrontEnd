import { CustomerLocation } from "./customer-location";

export interface Customer {

  id: number;

  rut: string;
  nombre: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  comuna?: CustomerLocation | null;
  ciudad?: CustomerLocation | null;
  email: string;
  telefono: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}