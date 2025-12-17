import express from 'express';
import { placeOrder, getOrders, getOrder } from '../controllers/orderController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticate);

router.post('/', placeOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);

export default router;
