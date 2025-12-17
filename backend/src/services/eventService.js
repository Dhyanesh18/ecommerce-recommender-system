import { pool } from '../db/postgres.js';
import { redis } from '../db/redis.js';

const EVENT_WEIGHTS = {
    view: 'views',
    click: 'clicks',
    add_to_cart: 'add_to_carts',
    purchase: 'purchases'
};

export const recordEvent = async ({ userId, productId, eventType, metadata = {} }) => {
    if (!userId || !productId || !eventType) {
        throw new Error('Missing required fields');
    }
    
    try {
        // Always save to PostgreSQL
        const { rows } = await pool.query(
            `INSERT INTO events (user_id, product_id, event_type, metadata)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [userId, productId, eventType, JSON.stringify(metadata)]
        );
        console.log(`✅ Event logged: ${eventType} - user:${userId}, product:${productId}`);

        // Try to update Redis (non-blocking, best effort)
        try {
            if (redis.status === 'ready') {
                const key = `user:${userId}:item:${productId}`;
                const field = EVENT_WEIGHTS[eventType];
                
                if (field) {
                    const pipeline = redis.pipeline();
                    pipeline.hincrby(key, field, 1);
                    pipeline.hset(key, 'last_interaction', Date.now());
                    pipeline.expire(key, 60 * 60 * 24 * 30); // 30 days TTL
                    await pipeline.exec();
                    console.log(`✅ Redis updated for event: ${eventType}`);
                }
            }
        } catch (redisErr) {
            // Redis error should not fail the event tracking
            console.warn('⚠️  Redis update failed (non-critical):', redisErr.message);
        }

        return rows[0];
    } catch (err) {
        console.error('❌ Failed to record event:', err);
        throw err;
    }
};

