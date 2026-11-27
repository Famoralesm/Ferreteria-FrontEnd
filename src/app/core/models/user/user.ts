import { Role } from '../../enums/role';

export interface User {

  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  storeId?: number | null;
  storeName?: string | null;

  avatarUrl?: string | null;

}