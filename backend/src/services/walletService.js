import { pool } from '../db/postgres.js';

/**
 * Get or create wallet for a user
 */
export const getOrCreateWallet = async (userId, client = null) => {
    const db = client || pool;
    
    // Try to get existing wallet
    let { rows } = await db.query(
        'SELECT * FROM wallets WHERE user_id = $1',
        [userId]
    );
    
    if (rows.length === 0) {
        // Create wallet with default balance of 1,000,000
        const { rows: newWallet } = await db.query(
            'INSERT INTO wallets (user_id, balance) VALUES ($1, 1000000.00) RETURNING *',
            [userId]
        );
        return newWallet[0];
    }
    
    return rows[0];
};

/**
 * Get wallet balance for a user
 */
export const getWalletBalance = async (userId) => {
    const wallet = await getOrCreateWallet(userId);
    return wallet.balance;
};

/**
 * Process a wallet transaction (credit or debit)
 */
export const processWalletTransaction = async ({ 
    userId, 
    amount, 
    transactionType, 
    orderId = null, 
    description = '', 
    metadata = {},
    client = null 
}) => {
    const db = client || pool;
    const isExternalClient = client !== null;
    
    try {
        if (!isExternalClient) {
            await db.query('BEGIN');
        }
        
        // Get or create wallet
        const wallet = await getOrCreateWallet(userId, db);
        
        // Calculate new balance
        let newBalance;
        if (transactionType === 'credit' || transactionType === 'refund') {
            newBalance = parseFloat(wallet.balance) + parseFloat(amount);
        } else if (transactionType === 'debit') {
            newBalance = parseFloat(wallet.balance) - parseFloat(amount);
            
            // Check if sufficient balance
            if (newBalance < 0) {
                throw new Error('Insufficient wallet balance');
            }
        } else {
            throw new Error('Invalid transaction type');
        }
        
        // Update wallet balance
        await db.query(
            'UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newBalance, wallet.id]
        );
        
        // Record transaction
        const { rows } = await db.query(
            `INSERT INTO wallet_transactions 
            (wallet_id, order_id, transaction_type, amount, balance_after, description, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [wallet.id, orderId, transactionType, amount, newBalance, description, JSON.stringify(metadata)]
        );
        
        if (!isExternalClient) {
            await db.query('COMMIT');
        }
        
        return {
            transaction: rows[0],
            newBalance
        };
    } catch (err) {
        if (!isExternalClient) {
            await db.query('ROLLBACK');
        }
        throw err;
    }
};

/**
 * Get wallet transaction history
 */
export const getWalletTransactions = async (userId, limit = 50) => {
    const wallet = await getOrCreateWallet(userId);
    
    const { rows } = await pool.query(
        `SELECT * FROM wallet_transactions 
        WHERE wallet_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2`,
        [wallet.id, limit]
    );
    
    return rows;
};

/**
 * Get seller statistics (total sales and active orders)
 */
export const getSellerStats = async (sellerId) => {
    const client = await pool.connect();
    
    try {
        // Get total sales from all orders containing seller's products
        const { rows: salesRows } = await client.query(
            `SELECT COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) as total_sales
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE p.seller_id = $1 AND o.status NOT IN ('cancelled')`,
            [sellerId]
        );
        
        // Get active orders count (orders containing seller's products that are not delivered or cancelled)
        const { rows: ordersRows } = await client.query(
            `SELECT COUNT(DISTINCT o.id) as active_orders
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE p.seller_id = $1 AND o.status NOT IN ('delivered', 'cancelled')`,
            [sellerId]
        );
        
        return {
            totalSales: parseFloat(salesRows[0].total_sales),
            activeOrders: parseInt(ordersRows[0].active_orders)
        };
    } finally {
        client.release();
    }
};
