export default function requireSeller(req, res, next) {
    if (req.user.role !== 'seller') {
        return res.status(403).json({ message: 'Seller access only' });
    }
    next();
}
