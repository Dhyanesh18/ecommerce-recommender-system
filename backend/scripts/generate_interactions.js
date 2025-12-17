import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ecommerce',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

// User behavior profiles - increased ranges
const USER_PROFILES = {
    BROWSER: { views: [12, 20], clicks: [5, 10], carts: [2, 4], purchases: [0, 2] },
    DECISIVE: { views: [5, 10], clicks: [3, 6], carts: [2, 4], purchases: [1, 3] },
    WINDOW_SHOPPER: { views: [15, 30], clicks: [8, 15], carts: [1, 4], purchases: [0, 1] },
    IMPULSE_BUYER: { views: [8, 12], clicks: [5, 8], carts: [3, 6], purchases: [2, 5] },
    RESEARCHER: { views: [20, 35], clicks: [12, 18], carts: [2, 5], purchases: [1, 2] }
};

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomProfile() {
    const profiles = Object.keys(USER_PROFILES);
    return USER_PROFILES[randomChoice(profiles)];
}

// Generate random session start time within last 30 days
function randomSessionStart() {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    return new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
}

// Generate next event timestamp (a few seconds to minutes after previous)
function getNextEventTime(previousTime, eventType) {
    const prevMillis = previousTime.getTime();
    let minGap, maxGap;
    
    switch(eventType) {
        case 'view':
            minGap = 5 * 1000;      // 5 seconds
            maxGap = 120 * 1000;    // 2 minutes
            break;
        case 'click':
            minGap = 2 * 1000;      // 2 seconds
            maxGap = 30 * 1000;     // 30 seconds
            break;
        case 'add_to_cart':
            minGap = 5 * 1000;      // 5 seconds
            maxGap = 60 * 1000;     // 1 minute
            break;
        case 'purchase':
            minGap = 10 * 1000;     // 10 seconds
            maxGap = 300 * 1000;    // 5 minutes
            break;
        default:
            minGap = 1000;
            maxGap = 10000;
    }
    
    const gap = minGap + Math.random() * (maxGap - minGap);
    return new Date(prevMillis + gap);
}

async function generateInteractions() {
    try {
        console.log('🚀 Starting interaction generation...\n');

        // Get all buyers (role = 'buyer')
        const { rows: users } = await pool.query(
            `SELECT id FROM users WHERE role = 'buyer' ORDER BY id`
        );

        // Get all products with categories
        const { rows: products } = await pool.query(
            `SELECT id, category, price FROM products WHERE is_active = true ORDER BY id`
        );

        if (users.length === 0 || products.length === 0) {
            console.log('❌ No users or products found!');
            return;
        }

        console.log(`📊 Found ${users.length} buyers and ${products.length} products`);
        console.log('🎭 Generating realistic user interactions...\n');

        const categories = [...new Set(products.map(p => p.category))];
        let totalEvents = 0;

        for (const user of users) {
            const profile = getRandomProfile();
            
            // Each user has 2-5 sessions within the 30 day period
            const numSessions = randomInt(2, 5);
            
            for (let session = 0; session < numSessions; session++) {
                // Start time for this session
                let currentTime = randomSessionStart();
                
                // Each user has favorite categories (1-3)
                const favCategories = [];
                const numFavCategories = randomInt(1, 3);
                for (let i = 0; i < numFavCategories; i++) {
                    const cat = randomChoice(categories);
                    if (!favCategories.includes(cat)) {
                        favCategories.push(cat);
                    }
                }

                // Get products from favorite categories (70%) and random (30%)
                const favoriteProducts = products.filter(p => favCategories.includes(p.category));
                const otherProducts = products.filter(p => !favCategories.includes(p.category));

                // Generate views
                const numViews = randomInt(profile.views[0], profile.views[1]);
                const viewedProducts = [];
                
                for (let i = 0; i < numViews; i++) {
                    // 70% chance to view favorite category
                    const productPool = Math.random() < 0.7 ? favoriteProducts : otherProducts;
                    if (productPool.length === 0) continue;
                    
                    const product = randomChoice(productPool);
                    viewedProducts.push({ id: product.id, time: currentTime });

                    await pool.query(
                        `INSERT INTO events (user_id, product_id, event_type, created_at) 
                        VALUES ($1, $2, 'view', $3)`,
                        [user.id, product.id, currentTime]
                    );
                    totalEvents++;
                    
                    // Update time for next view
                    currentTime = getNextEventTime(currentTime, 'view');
                }

                // Generate clicks (subset of viewed products)
                const numClicks = Math.min(randomInt(profile.clicks[0], profile.clicks[1]), viewedProducts.length);
                const clickedProducts = [];

                for (let i = 0; i < numClicks; i++) {
                    const viewedProduct = randomChoice(viewedProducts);
                    // Click must happen after the view
                    const clickTime = getNextEventTime(viewedProduct.time, 'click');
                    clickedProducts.push({ id: viewedProduct.id, time: clickTime });

                    await pool.query(
                        `INSERT INTO events (user_id, product_id, event_type, created_at) 
                        VALUES ($1, $2, 'click', $3)`,
                        [user.id, viewedProduct.id, clickTime]
                    );
                    totalEvents++;
                }

                // Generate add_to_cart (subset of clicked products)
                const numCarts = Math.min(randomInt(profile.carts[0], profile.carts[1]), clickedProducts.length);
                const cartProducts = [];

                for (let i = 0; i < numCarts; i++) {
                    const clickedProduct = clickedProducts[i];
                    // Add to cart must happen after the click
                    const cartTime = getNextEventTime(clickedProduct.time, 'add_to_cart');
                    cartProducts.push({ id: clickedProduct.id, time: cartTime });

                    await pool.query(
                        `INSERT INTO events (user_id, product_id, event_type, created_at) 
                        VALUES ($1, $2, 'add_to_cart', $3)`,
                        [user.id, clickedProduct.id, cartTime]
                    );
                    totalEvents++;
                }

                // Generate purchases (subset of cart products)
                const numPurchases = Math.min(randomInt(profile.purchases[0], profile.purchases[1]), cartProducts.length);
                
                for (let i = 0; i < numPurchases; i++) {
                    const cartProduct = cartProducts[i];
                    const product = products.find(p => p.id === cartProduct.id);
                    // Purchase must happen after add to cart
                    const purchaseTime = getNextEventTime(cartProduct.time, 'purchase');

                    await pool.query(
                        `INSERT INTO events (user_id, product_id, event_type, metadata, created_at) 
                        VALUES ($1, $2, 'purchase', $3, $4)`,
                        [
                            user.id, 
                            cartProduct.id, 
                            JSON.stringify({ price: product.price, quantity: 1 }),
                            purchaseTime
                        ]
                    );
                    totalEvents++;
                }
            }

            // Progress indicator
            if (user.id % 10 === 0) {
                console.log(`✅ Generated interactions for ${user.id} users...`);
            }
        }

        console.log('\n✨ Interaction generation complete!');
        console.log(`📈 Total events generated: ${totalEvents}`);

        // Show summary statistics
        const { rows: stats } = await pool.query(`
            SELECT 
                event_type,
                COUNT(*) as count,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT product_id) as unique_products
            FROM events
            GROUP BY event_type
            ORDER BY 
                CASE event_type
                    WHEN 'view' THEN 1
                    WHEN 'click' THEN 2
                    WHEN 'add_to_cart' THEN 3
                    WHEN 'purchase' THEN 4
                END
        `);

        console.log('\n📊 Event Statistics:');
        console.log('─'.repeat(60));
        stats.forEach(stat => {
            console.log(`${stat.event_type.padEnd(15)} | ${String(stat.count).padStart(6)} events | ${String(stat.unique_users).padStart(4)} users | ${String(stat.unique_products).padStart(4)} products`);
        });
        console.log('─'.repeat(60));

        // Calculate conversion funnel
        const viewCount = stats.find(s => s.event_type === 'view')?.count || 0;
        const clickCount = stats.find(s => s.event_type === 'click')?.count || 0;
        const cartCount = stats.find(s => s.event_type === 'add_to_cart')?.count || 0;
        const purchaseCount = stats.find(s => s.event_type === 'purchase')?.count || 0;

        console.log('\n🎯 Conversion Funnel:');
        console.log(`Views → Clicks:        ${((clickCount / viewCount) * 100).toFixed(1)}%`);
        console.log(`Clicks → Cart:         ${((cartCount / clickCount) * 100).toFixed(1)}%`);
        console.log(`Cart → Purchase:       ${((purchaseCount / cartCount) * 100).toFixed(1)}%`);
        console.log(`Overall Conversion:    ${((purchaseCount / viewCount) * 100).toFixed(1)}%`);

    } catch (err) {
        console.error('❌ Error generating interactions:', err);
    } finally {
        await pool.end();
    }
}

generateInteractions();