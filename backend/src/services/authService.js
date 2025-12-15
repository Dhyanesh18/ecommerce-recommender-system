import { pool } from "../db/postgres";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;

export const signupService = async({ email, password, role }) => {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
        `INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, $3)`, [email, hashed, role]
    );
    return result.rows[0];
};

export const loginService = async({ email, password }) => {
    const result = await pool.query(`SELECT * FROM users WHERE email=$1`, [email]);
    const user = result.rows[0];
    if (!user) throw new Error('invalid credentials');
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new Error('invalid credentials');

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    return token;
};