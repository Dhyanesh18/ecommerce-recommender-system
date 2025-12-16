# Quick Start Guide

## Prerequisites

Before you begin, ensure you have installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Redis** 6+ ([Download](https://redis.io/download))
- **Python** 3.9+ (for ML service later)

## Setup Steps

### 1. Database Setup

#### Start PostgreSQL

Make sure PostgreSQL is running on your system.

#### Create Database

```bash
# Using psql
createdb ecommerce_db

# Or using SQL
psql -U postgres
CREATE DATABASE ecommerce_db;
\q
```

#### Run Schema

```bash
cd backend
psql ecommerce_db < src/db/schema.sql
```

### 2. Redis Setup

#### Start Redis Server

```bash
redis-server
```

Keep this terminal open, or run Redis as a background service.

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

#### Configure `.env`

Edit `backend/.env` with your settings:

```env
PORT=4000
NODE_ENV=development

# Update with your PostgreSQL credentials
POSTGRES_URL=postgresql://postgres:password@localhost:5432/ecommerce_db

REDIS_URL=redis://localhost:6379

# Generate a secure secret for production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

CORS_ORIGIN=http://localhost:5173
```

#### Start Backend

```bash
npm run dev
```

You should see: `BACKEND running on port 4000`

### 4. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

#### Configure `.env`

Edit `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

#### Start Frontend

```bash
npm run dev
```

You should see: `Local: http://localhost:5173/`

### 5. Verify Setup

#### Test Backend

```bash
curl http://localhost:4000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

#### Test Frontend

Open browser to: `http://localhost:5173/`

## Testing the Application

### 1. Create a User Account

1. Navigate to `http://localhost:5173/signup`
2. Fill in:
   - Email: `test@example.com`
   - Password: `password123`
   - Role: Select `buyer` or `seller`
3. Click **Sign Up**

### 2. Login

1. Navigate to `http://localhost:5173/login`
2. Enter your credentials
3. You'll be redirected to the products page

### 3. Test as Seller

If you created a seller account:

1. Navigate to `/seller/dashboard`
2. Create a product:
   - Name: "Test Product"
   - Category: "Electronics"
   - Price: 99.99
   - Stock: 10
   - Images: (optional array of URLs)

### 4. Test as Buyer

1. Navigate to `/products`
2. Browse products
3. Click "Add to Cart"
4. Navigate to `/cart`
5. Update quantities or remove items

## Common Issues

### PostgreSQL Connection Error

```
Error: connect ECONNREFUSED
```

**Solution**:

- Ensure PostgreSQL is running
- Check your `POSTGRES_URL` in `.env`
- Test connection: `psql ecommerce_db`

### Redis Connection Error

```
Error: Redis connection refused
```

**Solution**:

- Start Redis: `redis-server`
- Check Redis is running: `redis-cli ping` (should return "PONG")

### Port Already in Use

```
Error: Port 4000 is already in use
```

**Solution**:

- Change port in `backend/.env`: `PORT=4001`
- Update frontend `.env`: `VITE_API_BASE_URL=http://localhost:4001`

### CORS Issues

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**:

- Verify `CORS_ORIGIN` in backend `.env` matches frontend URL
- Restart backend after changing `.env`

## API Testing with cURL

### Signup

```bash
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "buyer"
  }'
```

### Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the token from the response!

### Get Products

```bash
curl http://localhost:4000/products
```

### Add to Cart (requires auth)

```bash
curl -X POST http://localhost:4000/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "productId": 1,
    "quantity": 2
  }'
```

### Get Cart

```bash
curl http://localhost:4000/cart \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Log Event

```bash
curl -X POST http://localhost:4000/events \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "productId": 1,
    "eventType": "view"
  }'
```

## Database Verification

### Check tables were created

```bash
psql ecommerce_db

\dt  -- List all tables

SELECT * FROM users;
SELECT * FROM products;
SELECT * FROM events;
```

### Check Redis data

```bash
redis-cli

# View all keys
KEYS *

# Check a user-item interaction
HGETALL user:1:item:1
```

## Development Workflow

1. **Backend changes**: Server auto-reloads with nodemon
2. **Frontend changes**: Vite HMR (Hot Module Replacement)
3. **Database changes**: Run SQL manually in psql
4. **Environment changes**: Restart servers after `.env` updates

## Next Steps

✅ Application running locally
✅ Database schema created
✅ Auth and cart working

**Now you can**:

1. Add sample products
2. Test user interactions
3. Explore the event tracking data
4. Start building the ML recommender system

## Useful Commands

```bash
# Backend
npm run dev          # Start development server
npm start            # Start production server

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
psql ecommerce_db                    # Connect to database
psql ecommerce_db < schema.sql       # Run schema file

# Redis
redis-server                         # Start Redis
redis-cli                           # Connect to Redis CLI
redis-cli FLUSHALL                  # Clear all Redis data (careful!)
```

## Additional Resources

- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

---

**Need help?** Check the [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for detailed information.
