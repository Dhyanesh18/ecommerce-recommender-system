import api from './api';

export const getWallet = async () => {
    const response = await api.get('/wallet');
    return response.data;
};

export const getWalletTransactions = async (limit = 50) => {
    const response = await api.get(`/wallet/transactions?limit=${limit}`);
    return response.data.transactions;
};

export const getSellerStats = async () => {
    const response = await api.get('/wallet/seller-stats');
    return response.data;
};
