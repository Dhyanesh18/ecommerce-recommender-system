import { pool } from '../db/postgres.js';
import { redis } from '../db/redis.js';

const EVENT_WEIGHTS = {
    view: 'views',
    click: 'clicks',
    add_to_cart: 'clicks',
    purchase: 'purchases'
};

export const recordEvent = async ({ userId, productId, eventType }) => {
    if (!userId || !productId || !eventType) {
        throw new Error('Missing required fields');
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO events (user_id, product_id, event_type)VALUES ($1, $2, $3)
            RETURNING *`,
            [userId, productId, eventType]
        );
        console.log(rows[0]);

        const key = `user:${userId}:item:${productId}`;
        const field = EVENT_WEIGHTS[eventType];
        if (field){
            const pipeline = redis.pipeline();
            pipeline.hincrby(key, field, 1);
            pipeline.hset(key, 'last_interaction', Date.now());
            await pipeline.exec();
        }

    } catch (err) {
        console.error('Failed to record event:', err);
        throw err;
    }
};

