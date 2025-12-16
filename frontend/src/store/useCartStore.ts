import { create } from 'zustand';
import type { Cart } from '../services/cartApi';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../services/cartApi';

interface CartStore extends Cart {
    loading: boolean;
    error: string | null;
    fetchCart: () => Promise<void>;
    addItem: (productId: number, quantity?: number) => Promise<void>;
    updateItem: (productId: number, quantity: number) => Promise<void>;
    removeItem: (productId: number) => Promise<void>;
    clear: () => Promise<void>;
}

export const useCartStore = create<CartStore>((set, get) => ({
    items: [],
    total: 0,
    itemCount: 0,
    loading: false,
    error: null,

    fetchCart: async () => {
        set({ loading: true, error: null });
        try {
            const cart = await getCart();
            set({ ...cart, loading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch cart';
            set({ error: message, loading: false });
        }
    },

    addItem: async (productId: number, quantity = 1) => {
        set({ loading: true, error: null });
        try {
            await addToCart(productId, quantity);
            await get().fetchCart();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to add item';
            set({ error: message, loading: false });
        }
    },

    updateItem: async (productId: number, quantity: number) => {
        set({ loading: true, error: null });
        try {
            await updateCartItem(productId, quantity);
            await get().fetchCart();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update item';
            set({ error: message, loading: false });
        }
    },

    removeItem: async (productId: number) => {
        set({ loading: true, error: null });
        try {
            await removeFromCart(productId);
            await get().fetchCart();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to remove item';
            set({ error: message, loading: false });
        }
    },

    clear: async () => {
        set({ loading: true, error: null });
        try {
            await clearCart();
            set({ items: [], total: 0, itemCount: 0, loading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to clear cart';
            set({ error: message, loading: false });
        }
    },
}));
