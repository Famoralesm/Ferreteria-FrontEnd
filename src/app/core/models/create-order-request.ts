import { OrderItem } from './order-item';

export interface CreateOrderRequest {

    customerName: string;

    phone: string;

    address: string;

    deliveryDate: string;

    paymentMethod: string;

    notes: string;

    status: string;

    items: OrderItem[];

}