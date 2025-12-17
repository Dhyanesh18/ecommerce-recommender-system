import { pool } from '../db/postgres.js';

export async function getCategories(req, res) {
    try {
        const result = await pool.query(
            `SELECT DISTINCT category FROM products ORDER BY category`
        );
        
        const categories = result.rows.map(row => row.category);
        res.json({ categories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
}

export async function getProducts(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const category = req.query.category;

    try {
        let query = `
        SELECT 
            p.id,
            p.name,
            p.description,
            p.category,
            CAST(p.price AS FLOAT) as price,
            p.stock,
            p.created_at,
            COALESCE(
                array_agg(pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL),
                ARRAY[]::TEXT[]
            ) AS images
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        `;
        
        const params = [limit, offset];
        
        if (category && category !== 'all') {
            query += ` WHERE p.category = $3`;
            params.push(category);
        }
        
        query += `
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
        `;
        
        const result = await pool.query(query, params);

        // Debug: Log first product to check images structure
        if (result.rows.length > 0) {
            console.log('Sample product:', JSON.stringify(result.rows[0], null, 2));
        }

        res.json({ page, results: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
}

export async function getProductById(req, res) {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `
            SELECT 
                p.id, p.seller_id, p.name, p.description, p.category, 
                CAST(p.price AS FLOAT) as price, p.stock, p.created_at,
                COALESCE(
                    array_agg(pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL),
                    ARRAY[]::TEXT[]
                ) AS images
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            WHERE p.id = $1
            GROUP BY p.id
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch product' });
    }
}

export async function getSellerProducts(req, res) {
    try {
        const result = await pool.query(
            `
            SELECT 
                p.id, p.name, p.description, p.category, 
                CAST(p.price AS FLOAT) as price, p.stock, p.created_at,
                COALESCE(
                    array_agg(pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL),
                    ARRAY[]::TEXT[]
                ) as images
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            WHERE p.seller_id = $1
            GROUP BY p.id
            ORDER BY p.created_at DESC
            `,
            [req.user.id]
        );

        res.json({ products: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch seller products' });
    }
}

export async function createProduct(req, res) {
    const { name, description, category, price, stock, images } = req.body;

    // Debug logging
    console.log('Creating product with data:', {
        name,
        category,
        price,
        stock,
        imagesCount: Array.isArray(images) ? images.length : 0,
        images: images
    });

    if (!name || !category || !price) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        await pool.query('BEGIN');

        const productResult = await pool.query(
        `
        INSERT INTO products (seller_id, name, description, category, price, stock)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        `,
        [req.user.id, name, description || null, category, price, stock || 0]
        );

        const productId = productResult.rows[0].id;

        if (Array.isArray(images)) {
        for (const url of images) {
            await pool.query(
            `
            INSERT INTO product_images (product_id, image_url)
            VALUES ($1, $2)
            `,
            [productId, url]
            );
        }
        }

        await pool.query('COMMIT');

        res.status(201).json({ message: 'Product created', productId });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Failed to create product' });
    }
}
