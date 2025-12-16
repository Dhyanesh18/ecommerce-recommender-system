import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || 'ecommerce',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD
});