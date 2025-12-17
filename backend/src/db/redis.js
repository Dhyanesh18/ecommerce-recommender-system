import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    lazyConnect: true
});

redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
});

redis.on('close', () => {
    console.log('⚠️  Redis connection closed');
});

// Try to connect
redis.connect().catch((err) => {
    console.error('❌ Failed to connect to Redis:', err.message);
    console.log('⚠️  Event tracking will continue with PostgreSQL only');
});