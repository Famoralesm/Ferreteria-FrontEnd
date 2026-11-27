import { Role } from '../../enums/role';

export interface UserRequest {

  name: string;

  email: string;

  password?: string;

  role: Role;

  storeId: number;

  active: boolean;

}