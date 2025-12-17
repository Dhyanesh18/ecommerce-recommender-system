-- Initialize wallets for all existing users who don't have one yet
INSERT INTO wallets (user_id, balance)
SELECT id, 1000000.00
FROM users
WHERE id NOT IN (SELECT user_id FROM wallets);

-- Verify wallet creation
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    w.balance
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
ORDER BY u.id;
