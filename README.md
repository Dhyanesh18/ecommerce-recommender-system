# E-commerce Recommender System

A production-grade e-commerce platform with an ML-powered recommender system featuring continual learning. Built to showcase both development and data science skills.

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **State Management**: Zustand
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (transactional data) + Redis (real-time features)
- **ML Service**: FastAPI + PyTorch/scikit-learn
- **Model Serving**: FAISS for similarity search

### System Components

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   React     │────▶│   Express    │────▶│  PostgreSQL │
│  Frontend   │     │   Backend    │     │   Database  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                      │
                           │                      │
                           ▼                      ▼
                    ┌──────────┐          ┌────────────┐
                    │  Redis   │          │  FastAPI   │
                    │  Cache   │          │ Recommender│
                    └──────────┘          └────────────┘
```

## 🚀 Features Implemented

### ✅ Backend (Express)

- **Authentication System**
  - JWT-based auth with role-based access control (buyer/seller/admin)
  - Secure password hashing with bcrypt
  - Token-based authorization middleware
- **Event Tracking System**
  - Real-time event logging (views, clicks, cart actions, purchases)
  - PostgreSQL for persistent storage
  - Redis for real-time aggregation and caching
  - Event weighting for ML features
- **Product Management**
  - CRUD operations for products
  - Multi-image support
  - Seller-specific product creation
  - Category-based organization

### ✅ Database Schema

- Users (with role-based access)
- Products (with images and seller relationships)
- Events (comprehensive interaction tracking)
- Cart & Orders (full e-commerce flow)
- Product Embeddings (ML features)
- User Features (personalization data)
- Model Metadata (ML model versioning)

### 🚧 In Progress / To Implement

#### Backend

- [ ] Cart management endpoints
- [ ] Order processing endpoints
- [ ] Search functionality
- [ ] Product recommendations endpoint
- [ ] Admin dashboard APIs
- [ ] Payment integration

#### Frontend

- [ ] Product listing page
- [ ] Product detail page
- [ ] Shopping cart
- [ ] Checkout flow
- [ ] User dashboard
- [ ] Seller dashboard (partially done)
- [ ] Recommendation widgets

#### ML/Recommender System

- [ ] Collaborative filtering model
- [ ] Content-based filtering
- [ ] Hybrid recommendation system
- [ ] Feature engineering pipeline
- [ ] Model training pipeline
- [ ] A/B testing framework
- [ ] Continual learning system
- [ ] Real-time inference API

## 📦 Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Python 3.9+

### Backend Setup

1. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database**

   ```bash
   # Create database
   createdb ecommerce_db

   # Run schema
   psql ecommerce_db < src/db/schema.sql
   ```

4. **Start Redis**

   ```bash
   redis-server
   ```

5. **Run backend**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```

### Recommender System Setup

1. **Install Python dependencies**

   ```bash
   cd recommender
   pip install -r requirements.txt
   ```

2. **Run FastAPI server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## 🔌 API Endpoints

### Authentication

- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

### Products

- `GET /products` - List products (paginated)
- `POST /products` - Create product (seller only)

### Events

- `POST /events` - Log user interaction event

### Health

- `GET /health` - Service health check

## 🧠 ML Pipeline (Planned)

### Data Flow

1. **Event Collection**: User interactions stored in PostgreSQL + Redis
2. **Feature Engineering**: Aggregate user behavior, product features
3. **Model Training**: Periodic retraining with new data
4. **Model Evaluation**: A/B testing, offline metrics
5. **Deployment**: Model versioning and gradual rollout
6. **Monitoring**: Performance tracking, data drift detection
7. **Continual Learning**: Incremental updates based on new patterns

### Models to Implement

1. **Collaborative Filtering**: User-item interaction matrix
2. **Content-Based**: Product feature similarity
3. **Two-Tower Neural Network**: Deep learning embeddings
4. **Ranking Model**: XGBoost/LightGBM for final ranking
5. **Cold Start Solution**: Popularity + content features

## 📊 Redis Schema

```
# User-Item Interactions
user:{userId}:item:{productId} -> Hash {
  views: count,
  clicks: count,
  add_to_cart: count,
  purchases: count,
  last_interaction: timestamp
}

# Product Stats
product:{productId}:stats -> Hash {
  total_views: count,
  total_purchases: count,
  avg_rating: float
}
```

## 🔐 Security Features

- JWT token authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- SQL injection prevention (parameterized queries)
- CORS configuration
- Environment variable protection

## 📈 Next Steps

### Immediate Priorities

1. Complete frontend product pages
2. Implement cart and checkout flow
3. Build basic recommender API
4. Create data export scripts for ML training
5. Develop initial collaborative filtering model

### ML Development Roadmap

1. **Phase 1**: Historical data analysis & EDA
2. **Phase 2**: Baseline models (popularity, collaborative filtering)
3. **Phase 3**: Feature engineering & content-based filtering
4. **Phase 4**: Neural network models (two-tower, autoencoders)
5. **Phase 5**: Production pipeline & monitoring
6. **Phase 6**: Continual learning system

## 🎯 Project Goals

- Demonstrate production-ready full-stack development
- Showcase ML/DS skills with real-world application
- Implement industry-standard recommender system
- Build scalable, maintainable architecture
- Document ML experimentation and model development

## 📝 License

MIT
