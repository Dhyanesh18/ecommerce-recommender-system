import { createOrder, getUserOrders, getOrderById } from '../services/orderService.js';

export const placeOrder = async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;
        const userId = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items in order' });
        }

        if (!shippingAddress) {
            return res.status(400).json({ error: 'Shipping address is required' });
        }

        const order = await createOrder({ userId, items, shippingAddress });

        res.status(201).json({ 
            message: 'Order placed successfully', 
            order 
        });
    } catch (err) {
        console.error('Failed to place order:', err);
        res.status(500).json({ error: err.message || 'Failed to place order' });
    }
};

export const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await getUserOrders(userId);
        res.json({ orders });
    } catch (err) {
        console.error('Failed to get orders:', err);
        res.status(500).json({ error: 'Failed to retrieve orders' });
    }
};

export const getOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const order = await getOrderById(parseInt(id), userId);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json({ order });
    } catch (err) {
        console.error('Failed to get order:', err);
        res.status(500).json({ error: 'Failed to retrieve order' });
    }
};
