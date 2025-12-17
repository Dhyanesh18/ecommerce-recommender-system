import express from 'express';
import { getWallet, getTransactions, getSellerStatistics } from '../controllers/walletController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All wallet routes require authentication
router.use(authenticate);

router.get('/', getWallet);
router.get('/transactions', getTransactions);
router.get('/seller-stats', authorizeRole('seller'), getSellerStatistics);

export default router;
