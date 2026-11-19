export interface OrderItem {
    id?: number;
    productId: number | null;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    wholesaleApplied?: boolean;
    pricingType?: string;
}
