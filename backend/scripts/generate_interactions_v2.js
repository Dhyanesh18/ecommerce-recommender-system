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

/* ===========================
   Tuned User Behavior Profiles
   =========================== */

const USER_PROFILES = {
    BROWSER:        { views: [10, 18], clicks: [3, 6], carts: [0, 2], purchases: [0, 1] },
    WINDOW_SHOPPER: { views: [15, 28], clicks: [5, 10], carts: [0, 2], purchases: [0, 1] },
    RESEARCHER:     { views: [18, 32], clicks: [8, 14], carts: [1, 3], purchases: [0, 1] },
    DECISIVE:       { views: [5, 10],  clicks: [3, 5], carts: [1, 2], purchases: [0, 1] },
    IMPULSE_BUYER:  { views: [6, 10],  clicks: [4, 7], carts: [1, 3], purchases: [1, 2] }
};

/* ===========================
   Funnel Drop-off Probabilities
   =========================== */

const CLICK_PROB    = 0.65;
const CART_PROB     = 0.40;
const PURCHASE_PROB = 0.25;

/* ===========================
   Helpers
   =========================== */

const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = arr => arr[Math.floor(Math.random() * arr.length)];

const randomSessionStart = () => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    return new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
};

function getNextEventTime(previousTime, type) {
    const prev = previousTime.getTime();
    const gaps = {
        view:        [5e3, 120e3],
        click:       [2e3, 30e3],
        add_to_cart: [5e3, 60e3],
        purchase:    [10e3, 300e3]
    };
    const [min, max] = gaps[type] || [1e3, 10e3];
    return new Date(prev + min + Math.random() * (max - min));
}

/* ===========================
   Generator
   =========================== */

async function generateInteractions() {
    const client = await pool.connect();
    
    try {
        console.log('🚀 Generating realistic interactions...\n');

        const { rows: users } = await client.query(
            `SELECT id FROM users WHERE role = 'buyer' ORDER BY id`
        );

        const { rows: products } = await client.query(
            `SELECT id, category, price FROM products WHERE is_active = true`
        );

        const categories = [...new Set(products.map(p => p.category))];
        let totalEvents = 0;

        for (const user of users) {
            const profile = randomChoice(Object.values(USER_PROFILES));
            const sessions = randomInt(2, 4);

            for (let s = 0; s < sessions; s++) {
                let time = randomSessionStart();

                /* ---- Category preference ---- */
                const favCats = new Set(
                    Array.from({ length: randomInt(1, 3) },
                        () => randomChoice(categories))
                );

                const favProducts = products.filter(p => favCats.has(p.category));
                const otherProducts = products.filter(p => !favCats.has(p.category));

                /* ---- Views ---- */
                const viewed = [];
                for (let i = 0; i < randomInt(...profile.views); i++) {
                    const productPool = Math.random() < 0.7 ? favProducts : otherProducts;
                    if (!productPool.length) continue;

                    const product = randomChoice(productPool);
                    viewed.push({ id: product.id, time });

                    await client.query(
                        `INSERT INTO events (user_id, product_id, event_type, created_at)
                         VALUES ($1, $2, 'view', $3)`,
                        [user.id, product.id, time]
                    );
                    totalEvents++;
                    time = getNextEventTime(time, 'view');
                }

                /* ---- Clicks ---- */
                const clicked = [];
                for (const v of viewed) {
                    if (Math.random() > CLICK_PROB) continue;

                    const t = getNextEventTime(v.time, 'click');
                    clicked.push({ id: v.id, time: t });

                    await client.query(
                        `INSERT INTO events (user_id, product_id, event_type, created_at)
                         VALUES ($1, $2, 'click', $3)`,
                        [user.id, v.id, t]
                    );
                    totalEvents++;
                }

                /* ---- Cart ---- */
                const carted = [];
                for (const c of clicked) {
                    if (Math.random() > CART_PROB) continue;

                    const t = getNextEventTime(c.time, 'add_to_cart');
                    carted.push({ id: c.id, time: t });

                    await client.query(
                        `INSERT INTO events (user_id, product_id, event_type, created_at)
                         VALUES ($1, $2, 'add_to_cart', $3)`,
                        [user.id, c.id, t]
                    );
                    totalEvents++;
                }

                /* ---- Purchase (cap per session) ---- */
                const shuffled = carted.sort(() => 0.5 - Math.random());
                const maxPurchases = Math.random() < 0.1 ? 2 : 1;
                let purchased = 0;

                for (const c of shuffled) {
                    if (purchased >= maxPurchases) break;
                    if (Math.random() > PURCHASE_PROB) continue;

                    const product = products.find(p => p.id === c.id);
                    if (product.price > 1000 && Math.random() > 0.2) continue;

                    const t = getNextEventTime(c.time, 'purchase');

                    await client.query(
                        `INSERT INTO events (user_id, product_id, event_type, metadata, created_at)
                         VALUES ($1, $2, 'purchase', $3, $4)`,
                        [
                            user.id,
                            c.id,
                            JSON.stringify({ price: product.price, quantity: 1 }),
                            t
                        ]
                    );
                    totalEvents++;
                    purchased++;
                }
            }

            if (user.id % 10 === 0) {
                console.log(`✅ Processed ${user.id} users`);
            }
        }

        console.log('\n✨ Done!');
        console.log(`📈 Total events: ${totalEvents}`);

        /* ===========================
           Show Statistics
           =========================== */
        const { rows: stats } = await client.query(`
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
        console.error('❌ Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

generateInteractions();