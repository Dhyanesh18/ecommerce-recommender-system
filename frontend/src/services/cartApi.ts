import api from './api';

export interface CartItem {
    id: number;
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
    category: string;
    stock: number;
}

export interface Cart {
    items: CartItem[];
    total: number;
    itemCount: number;
}

export const getCart = async (): Promise<Cart> => {
    const response = await api.get('/cart');
    return response.data;
};

export const addToCart = async (productId: number, quantity = 1): Promise<CartItem> => {
    const response = await api.post('/cart', { productId, quantity });
    return response.data;
};

export const updateCartItem = async (productId: number, quantity: number): Promise<void> => {
    await api.put('/cart', { productId, quantity });
};

export const removeFromCart = async (productId: number): Promise<void> => {
    await api.delete(`/cart/${productId}`);
};

export const clearCart = async (): Promise<void> => {
    await api.delete('/cart');
};
