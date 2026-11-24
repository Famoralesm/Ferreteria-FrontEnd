export interface OrderSummary {

    id:number;

    orderNumber?: string;

    cliente:string;

    fecha:string;

    total:number;

    estado:string;
    
    statusChangedAt: string;

}