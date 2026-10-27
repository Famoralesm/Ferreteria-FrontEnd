import { CreateOrderItemRequest } from './create-order-item-request';
export interface UpdateOrderRequest {

    customerName: string;

    phone: string;

    address: string;

    deliveryDate: string;

    paymentMethod: string;

    notes: string;
    
    items: CreateOrderItemRequest[];

    latitude?: number;
    
    longitude?: number;

  


}