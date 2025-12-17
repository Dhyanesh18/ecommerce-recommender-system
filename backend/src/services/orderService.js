import { pool } from '../db/postgres.js';
import { recordEvent } from './eventService.js';
import { getOrCreateWallet, processWalletTransaction } from './walletService.js';

export const createOrder = async ({ userId, items, shippingAddress }) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Calculate total and validate stock
        let totalAmount = 0;
        const orderItems = [];
        const sellerAmounts = {}; // Track amount per seller

        for (const item of items) {
            const { rows: productRows } = await client.query(
                'SELECT id, price, stock, seller_id FROM products WHERE id = $1',
                [item.product_id]
            );

            if (productRows.length === 0) {
                throw new Error(`Product ${item.product_id} not found`);
            }

            const product = productRows[0];

            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product ${item.product_id}`);
            }

            const itemTotal = parseFloat(product.price) * item.quantity;
            totalAmount += itemTotal;

            // Track amount per seller
            if (!sellerAmounts[product.seller_id]) {
                sellerAmounts[product.seller_id] = 0;
            }
            sellerAmounts[product.seller_id] += itemTotal;

            orderItems.push({
                product_id: item.product_id,
                quantity: item.quantity,
                price_at_purchase: product.price,
                seller_id: product.seller_id
            });
        }

        // Check buyer's wallet balance
        const buyerWallet = await getOrCreateWallet(userId, client);
        if (parseFloat(buyerWallet.balance) < totalAmount) {
            throw new Error('Insufficient wallet balance');
        }

        // Debit buyer's wallet
        await processWalletTransaction({
            userId,
            amount: totalAmount,
            transactionType: 'debit',
            orderId: null, // Will update after order creation
            description: 'Payment for order',
            metadata: { items: items.length },
            client
        });

        // Create order
        const { rows: orderRows } = await client.query(
            `INSERT INTO orders (user_id, total_amount, status, shipping_address)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [userId, totalAmount, 'pending', JSON.stringify(shippingAddress)]
        );

        const order = orderRows[0];

        // Update buyer's transaction with order_id
        await client.query(
            `UPDATE wallet_transactions 
            SET order_id = $1, description = $2 
            WHERE wallet_id = (SELECT id FROM wallets WHERE user_id = $3) 
            AND order_id IS NULL 
            AND transaction_type = 'debit'
            ORDER BY created_at DESC 
            LIMIT 1`,
            [order.id, `Payment for order #${order.id}`, userId]
        );

        // Credit each seller's wallet
        for (const [sellerId, amount] of Object.entries(sellerAmounts)) {
            await processWalletTransaction({
                userId: parseInt(sellerId),
                amount,
                transactionType: 'credit',
                orderId: order.id,
                description: `Payment received for order #${order.id}`,
                metadata: { buyerId: userId },
                client
            });
        }

        // Insert order items and update stock
        for (const item of orderItems) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
                VALUES ($1, $2, $3, $4)`,
                [order.id, item.product_id, item.quantity, item.price_at_purchase]
            );

            // Update product stock
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );

            // Track purchase event for each product
            await recordEvent({
                userId,
                productId: item.product_id,
                eventType: 'purchase',
                metadata: {
                    orderId: order.id,
                    quantity: item.quantity,
                    price: item.price_at_purchase
                }
            });
        }

        // Clear user's cart
        await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

        await client.query('COMMIT');

        return order;
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Order creation failed:', err);
        throw err;
    } finally {
        client.release();
    }
};

export const getUserOrders = async (userId) => {
    const { rows } = await pool.query(
        `SELECT o.*, 
            json_agg(
                json_build_object(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'product_name', p.name,
                    'quantity', oi.quantity,
                    'price_at_purchase', oi.price_at_purchase
                )
            ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC`,
        [userId]
    );

    return rows;
};

export const getOrderById = async (orderId, userId) => {
    const { rows } = await pool.query(
        `SELECT o.*, 
            json_agg(
                json_build_object(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'product_name', p.name,
                    'quantity', oi.quantity,
                    'price_at_purchase', oi.price_at_purchase,
                    'product_image', (
                        SELECT image_url FROM product_images 
                        WHERE product_id = p.id AND is_primary = true 
                        LIMIT 1
                    )
                )
            ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.id = $1 AND o.user_id = $2
        GROUP BY o.id`,
        [orderId, userId]
    );

    return rows[0];
};
