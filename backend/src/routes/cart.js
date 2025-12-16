import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
    addToCartHandler,
    getCartHandler,
    updateCartItemHandler,
    removeFromCartHandler,
    clearCartHandler
} from '../controllers/cartController.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

router.get('/', getCartHandler);
router.post('/', addToCartHandler);
router.put('/', updateCartItemHandler);
router.delete('/:productId', removeFromCartHandler);
router.delete('/', clearCartHandler);

export default router;
