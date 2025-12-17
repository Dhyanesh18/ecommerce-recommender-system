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

async function checkData() {
    try {
        console.log('📊 E-commerce Database Summary\n');
        console.log('='.repeat(70));

        // Users summary
        const { rows: userStats } = await pool.query(`
            SELECT 
                role,
                COUNT(*) as count
            FROM users
            GROUP BY role
            ORDER BY role
        `);

        console.log('\n👥 USERS:');
        console.log('─'.repeat(70));
        userStats.forEach(stat => {
            console.log(`${stat.role.toUpperCase().padEnd(10)} | ${stat.count} users`);
        });

        // Products summary
        const { rows: productStats } = await pool.query(`
            SELECT 
                category,
                COUNT(*) as count,
                ROUND(AVG(price)::numeric, 2) as avg_price,
                ROUND(MIN(price)::numeric, 2) as min_price,
                ROUND(MAX(price)::numeric, 2) as max_price
            FROM products
            WHERE is_active = true
            GROUP BY category
            ORDER BY category
        `);

        console.log('\n📦 PRODUCTS BY CATEGORY:');
        console.log('─'.repeat(70));
        let totalProducts = 0;
        productStats.forEach(stat => {
            console.log(`${stat.category.padEnd(20)} | ${String(stat.count).padStart(3)} products | $${stat.min_price}-$${stat.max_price} (avg: $${stat.avg_price})`);
            totalProducts += parseInt(stat.count);
        });
        console.log(`${'TOTAL'.padEnd(20)} | ${totalProducts} products`);

        // Events summary
        const { rows: eventStats } = await pool.query(`
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

        console.log('\n🎯 INTERACTION EVENTS:');
        console.log('─'.repeat(70));
        if (eventStats.length > 0) {
            eventStats.forEach(stat => {
                console.log(`${stat.event_type.toUpperCase().padEnd(15)} | ${String(stat.count).padStart(6)} events | ${String(stat.unique_users).padStart(4)} users | ${String(stat.unique_products).padStart(4)} products`);
            });

            // Conversion metrics
            const viewCount = eventStats.find(s => s.event_type === 'view')?.count || 0;
            const clickCount = eventStats.find(s => s.event_type === 'click')?.count || 0;
            const cartCount = eventStats.find(s => s.event_type === 'add_to_cart')?.count || 0;
            const purchaseCount = eventStats.find(s => s.event_type === 'purchase')?.count || 0;

            if (viewCount > 0) {
                console.log('\n💡 CONVERSION FUNNEL:');
                console.log('─'.repeat(70));
                console.log(`Views → Clicks:        ${((clickCount / viewCount) * 100).toFixed(2)}%`);
                if (clickCount > 0) {
                    console.log(`Clicks → Cart:         ${((cartCount / clickCount) * 100).toFixed(2)}%`);
                }
                if (cartCount > 0) {
                    console.log(`Cart → Purchase:       ${((purchaseCount / cartCount) * 100).toFixed(2)}%`);
                }
                console.log(`Overall Conversion:    ${((purchaseCount / viewCount) * 100).toFixed(2)}%`);
            }
        } else {
            console.log('No events found. Run generate_interactions.js to create sample data.');
        }

        // Most active users
        const { rows: topUsers } = await pool.query(`
            SELECT 
                user_id,
                COUNT(*) as total_interactions,
                COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN product_id END) as purchases
            FROM events
            GROUP BY user_id
            ORDER BY total_interactions DESC
            LIMIT 5
        `);

        if (topUsers.length > 0) {
            console.log('\n🔥 TOP 5 MOST ACTIVE USERS:');
            console.log('─'.repeat(70));
            topUsers.forEach((user, index) => {
                console.log(`${index + 1}. User #${user.user_id.toString().padEnd(5)} | ${user.total_interactions} interactions | ${user.purchases} purchases`);
            });
        }

        // Most popular products
        const { rows: topProducts } = await pool.query(`
            SELECT 
                p.id,
                p.name,
                p.category,
                COUNT(*) as view_count,
                COUNT(DISTINCT CASE WHEN e.event_type = 'purchase' THEN e.user_id END) as purchases
            FROM events e
            JOIN products p ON e.product_id = p.id
            WHERE e.event_type = 'view'
            GROUP BY p.id, p.name, p.category
            ORDER BY view_count DESC
            LIMIT 5
        `);

        if (topProducts.length > 0) {
            console.log('\n⭐ TOP 5 MOST VIEWED PRODUCTS:');
            console.log('─'.repeat(70));
            topProducts.forEach((product, index) => {
                console.log(`${index + 1}. ${product.name.substring(0, 35).padEnd(35)} | ${product.view_count} views | ${product.purchases} purchases`);
            });
        }

        // Data quality checks
        console.log('\n✅ DATA QUALITY CHECKS:');
        console.log('─'.repeat(70));
        
        const totalEvents = eventStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);
        console.log(`✓ Total events: ${totalEvents}`);
        console.log(`✓ Users with interactions: ${eventStats[0]?.unique_users || 0}/${userStats.find(s => s.role === 'buyer')?.count || 0} buyers`);
        console.log(`✓ Products with views: ${eventStats[0]?.unique_products || 0}/${totalProducts} products`);
        
        if (totalEvents > 1000) {
            console.log('\n🎉 Great! You have enough data to start ML experiments.');
        } else if (totalEvents > 100) {
            console.log('\n⚠️  You have some data, but more interactions will improve model quality.');
        } else {
            console.log('\n❌ Not enough data yet. Run generate_interactions.js to create more.');
        }

        console.log('\n' + '='.repeat(70));

    } catch (err) {
        console.error('❌ Error checking data:', err);
    } finally {
        await pool.end();
    }
}

checkData();
