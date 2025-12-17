import { getWalletBalance, getWalletTransactions, getSellerStats } from '../services/walletService.js';

export const getWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const balance = await getWalletBalance(userId);
        
        res.json({ balance });
    } catch (err) {
        console.error('Failed to get wallet:', err);
        res.status(500).json({ error: 'Failed to retrieve wallet information' });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        
        const transactions = await getWalletTransactions(userId, limit);
        
        res.json({ transactions });
    } catch (err) {
        console.error('Failed to get transactions:', err);
        res.status(500).json({ error: 'Failed to retrieve transactions' });
    }
};

export const getSellerStatistics = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const stats = await getSellerStats(sellerId);
        
        res.json(stats);
    } catch (err) {
        console.error('Failed to get seller stats:', err);
        res.status(500).json({ error: 'Failed to retrieve seller statistics' });
    }
};
