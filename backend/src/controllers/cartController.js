import { addToCart, getCart, updateCartItem, removeFromCart, clearCart } from '../services/cartService.js';

export const addToCartHandler = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;

        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        const cartItem = await addToCart({ userId, productId, quantity: quantity || 1 });
        res.status(201).json(cartItem);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getCartHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await getCart(userId);
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateCartItemHandler = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;

        if (!productId || quantity === undefined) {
            return res.status(400).json({ error: 'Product ID and quantity are required' });
        }

        const result = await updateCartItem({ userId, productId, quantity });
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const removeFromCartHandler = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        await removeFromCart({ userId, productId: parseInt(productId) });
        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const clearCartHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        await clearCart(userId);
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
