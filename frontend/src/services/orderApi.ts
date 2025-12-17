import api from './api';

interface ShippingAddress {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
}

interface OrderItem {
    product_id: number;
    quantity: number;
}

interface PlaceOrderRequest {
    items: OrderItem[];
    shippingAddress: ShippingAddress;
}

export const placeOrder = async (data: PlaceOrderRequest) => {
    const response = await api.post('/orders', data);
    return response.data;
};

export const getOrders = async () => {
    const response = await api.get('/orders');
    return response.data.orders;
};

export const getOrderById = async (id: number) => {
    const response = await api.get(`/orders/${id}`);
    return response.data.order;
};
