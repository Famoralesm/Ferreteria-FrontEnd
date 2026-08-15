import { OrderItem } from './order-item';

export interface UpdateOrderRequest {

    customerName: string;

    phone: string;

    address: string;

    deliveryDate: string;

    paymentMethod: string;

    status: string;

    notes: string;



}