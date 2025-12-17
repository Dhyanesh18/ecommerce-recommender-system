import express from 'express';
import { getProducts, getProductById, getSellerProducts, getCategories, createProduct } from '../controllers/product.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import requireSeller from '../middleware/requireSeller.js';

const router = express.Router();

router.get('/categories', getCategories);
router.get('/', getProducts);
router.get('/seller/my-products', authenticate, requireSeller, getSellerProducts);
router.get('/:id', getProductById);
router.post('/', authenticate, requireSeller, createProduct);

export default router;
