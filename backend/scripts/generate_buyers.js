import pg from 'pg';
import bcrypt from 'bcrypt';
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

async function generateBuyers(count = 100) {
    try {
        console.log(`🚀 Generating ${count} buyer accounts...\n`);

        const password = await bcrypt.hash('12345678', 10);
        let created = 0;

        for (let i = 1; i <= count; i++) {
            const email = `buyer${i}@example.com`;

            try {
                await pool.query(
                    `INSERT INTO users (email, password_hash, role) 
                    VALUES ($1, $2, 'buyer')
                    ON CONFLICT (email) DO NOTHING`,
                    [email, password]
                );
                created++;

                if (i % 10 === 0) {
                    console.log(`✅ Created ${i} buyers...`);
                }
            } catch (err) {
                console.log(`⚠️  Buyer ${i} already exists, skipping...`);
            }
        }

        console.log(`\n✨ Successfully created ${created} buyer accounts!`);
        console.log(`📧 Email format: buyer1@example.com, buyer2@example.com, etc.`);
        console.log(`🔑 Password for all: password123`);

        // Show summary
        const { rows } = await pool.query(`
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        `);

        console.log('\n👥 User Summary:');
        console.log('─'.repeat(40));
        rows.forEach(row => {
            console.log(`${row.role.toUpperCase().padEnd(10)} | ${row.count} users`);
        });

    } catch (err) {
        console.error('❌ Error generating buyers:', err);
    } finally {
        await pool.end();
    }
}

// Get count from command line args or default to 50
const count = parseInt(process.argv[2]) || 50;
generateBuyers(count);
