import { pool } from '../db/postgres.js';

export const addToCart = async ({ userId, productId, quantity = 1 }) => {
    try {
        // Check if product exists and has sufficient stock
        const productCheck = await pool.query(
            `SELECT stock FROM products WHERE id = $1 AND is_active = true`,
            [productId]
        );

        if (productCheck.rows.length === 0) {
            throw new Error('Product not found or inactive');
        }

        if (productCheck.rows[0].stock < quantity) {
            throw new Error('Insufficient stock');
        }

        // Insert or update cart item
        const result = await pool.query(
            `INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, product_id)
            DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [userId, productId, quantity]
        );

        return result.rows[0];
    } catch (err) {
        throw err;
    }
};

export const getCart = async (userId) => {
    try {
        const result = await pool.query(
            `SELECT 
                ci.id,
                ci.quantity,
                ci.updated_at,
                p.id as product_id,
                p.name,
                p.price,
                p.category,
                p.stock,
                COALESCE(
                    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
                    (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1)
                ) as image_url
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = $1 AND p.is_active = true
            ORDER BY ci.updated_at DESC`,
            [userId]
        );

        const total = result.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
            items: result.rows,
            total,
            itemCount: result.rows.reduce((sum, item) => sum + item.quantity, 0)
        };
    } catch (err) {
        throw err;
    }
};

export const updateCartItem = async ({ userId, productId, quantity }) => {
    try {
        if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            await pool.query(
                `DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2`,
                [userId, productId]
            );
            return { deleted: true };
        }

        // Check stock availability
        const productCheck = await pool.query(
            `SELECT stock FROM products WHERE id = $1 AND is_active = true`,
            [productId]
        );

        if (productCheck.rows.length === 0) {
            throw new Error('Product not found or inactive');
        }

        if (productCheck.rows[0].stock < quantity) {
            throw new Error('Insufficient stock');
        }

        const result = await pool.query(
            `UPDATE cart_items 
            SET quantity = $3, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND product_id = $2
            RETURNING *`,
            [userId, productId, quantity]
        );

        if (result.rows.length === 0) {
            throw new Error('Cart item not found');
        }

        return result.rows[0];
    } catch (err) {
        throw err;
    }
};

export const removeFromCart = async ({ userId, productId }) => {
    try {
        const result = await pool.query(
            `DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 RETURNING *`,
            [userId, productId]
        );

        if (result.rows.length === 0) {
            throw new Error('Cart item not found');
        }

        return result.rows[0];
    } catch (err) {
        throw err;
    }
};

export const clearCart = async (userId) => {
    try {
        await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
        return { success: true };
    } catch (err) {
        throw err;
    }
};
