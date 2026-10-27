import { OrderItem } from './order-item';
import { UserSummary } from '../user/user-summary';

export interface Order {

  id: number;

  orderNumber: string;

  customerName: string;

  phone: string;

  address: string;

  deliveryDate: string;

  paymentMethod: string;

  status: string;
  
  statusChangedAt: string;

  notes: string;

  totalAmount: number;

  updated_at: string;

  wazeLink: string;

  createdAt: string;

  createdBy: UserSummary;

  items: OrderItem[];

}