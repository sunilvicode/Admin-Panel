# 🚀 NexusAdmin — Enterprise MERN Stack Admin & Inventory Dashboard

[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_%2B_Express_5-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/Security-JWT_%2B_Bcrypt_12-FF5722?logo=json-web-tokens&logoColor=white)](https://jwt.io/)
[![Validation](https://img.shields.io/badge/Data_Integrity-Express--Validator-00bcd4)](https://express-validator.github.io/)

A full-stack, production-grade **MERN (MongoDB, Express.js, React, Node.js)** Admin Panel and Inventory Management Platform built with enterprise security, Role-Based Access Control (RBAC), real-time aggregation analytics, email OTP password recovery, and dual-layer data validation.

---

## 📸 Key Highlights & Features

### 🔐 1. Authentication & Security
- **JWT Authentication:** Stateless token-based auth with 7-day expiration and automatic 401 token refresh/logout interceptor.
- **Bcrypt Password Hashing:** 12-round salt hashing for maximum resistance against rainbow table and brute-force attacks.
- **Role-Based Access Control (RBAC):**
  - `user`: Read-only access to catalogs and profile.
  - `admin`: Full management of products, inventory, and analytics overview.
  - `superadmin`: Unrestricted permissions, user role modifications, and permanent entity deletion.
- **Security Middlewares:** `Helmet.js` HTTP security headers, `express-rate-limit` (general + strict auth limiter), and `compression` gzip payload optimization.

### 📦 2. Product & Inventory Management
- **Full CRUD Operations:** Create, edit, search, filter, and delete products.
- **Live Stock Alerts:** Real-time visual status badges:
  - 🟢 `In Stock` (> 5 items)
  - 🟡 `Low Stock` (1 – 5 items)
  - 🔴 `Out of Stock` (0 items)
- **Multi-criteria Filtering:** Filter by category (Electronics, Clothing, Food, Books, Sports, Home, Beauty, Other) and status (`active` / `inactive`).
- **Server-Side Pagination & Whitelist Sorting:** Scalable querying with sorting by `price`, `stock`, `name`, or `createdAt`.

### 📊 3. Analytics & Aggregation Engine
- **MongoDB Aggregation Pipelines:** Real-time computation of total inventory valuation (`$multiply: ["$price", "$stock"]`), low-stock count, and category distribution.
- **Interactive Visualizations:** Responsive charts with custom tooltips, trend metrics, and KPI statistic cards.

### 🛡️ 4. Robust Dual-Layer Validation
- **Backend (`express-validator`):** Strict request body and parameter validation, sanitization, email normalization, and structured 400 error payloads.
- **Frontend (Live Touch Validation):** Instant field-level touched tracking, password strength calculation (Weak → Strong), requirements checklist, and clean inline error indicators.

### 📧 5. 3-Step Password Recovery (Email OTP)
- **Automated Dispatch:** Real SMTP email delivery via `nodemailer` (Gmail App Password) with automatic fallback to secure demo mode.
- **Time-bound Tokens:** 15-minute validity window with 6-digit numeric verification.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 (Vite Bundler)
- **Routing:** React Router DOM v7
- **Styling:** Modern Vanilla CSS Design System (Custom Glassmorphism, Dark UI, Sora & JetBrains Mono typography)
- **HTTP Client:** Axios (Configured with request/response interceptors)
- **Icons & Notifications:** Lucide React & Sonner Toast notifications

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js v5
- **Database ODM:** Mongoose v9
- **Security & Utilities:** `bcryptjs`, `jsonwebtoken`, `express-validator`, `helmet`, `cors`, `morgan`, `compression`, `nodemailer`

---

## 📂 Project Structure

```
Admin-Panel/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── productController.js  # Product CRUD & Aggregation stats
│   │   └── userController.js     # Auth, User CRUD, OTP flow
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT verification & RBAC authorization
│   │   ├── errorMiddleware.js    # 404 & Centralized error handler
│   │   └── validationMiddleware.js# express-validator schemas & formatter
│   ├── models/
│   │   ├── Product.js            # Product Schema with indexes
│   │   └── User.js               # User Schema with RBAC roles & OTP fields
│   ├── routes/
│   │   ├── productRoutes.js      # /api/products endpoints
│   │   └── userRoutes.js         # /api/users endpoints
│   ├── utils/
│   │   ├── emailService.js       # Nodemailer SMTP transporter
│   │   └── seedAdmin.js          # Default superadmin seeder
│   ├── server.js                 # Express server bootstrap & security middlewares
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js            # Axios instance with Bearer interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global Auth Provider & state
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Main layout with sidebar & top navigation
│   │   │   ├── Overview.jsx      # Analytics KPI cards & chart summaries
│   │   │   ├── Products.jsx      # Product management & inventory table
│   │   │   ├── UsersPage.jsx     # User management & role modification
│   │   │   ├── Login.jsx         # Modern split-screen sign in
│   │   │   ├── Register.jsx      # Sign up with password strength checklist
│   │   │   └── ForgotPassword.jsx# 3-step OTP recovery flow
│   │   ├── App.jsx               # Protected & public route definitions
│   │   ├── index.css             # Global dark theme design tokens & utilities
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## 📡 REST API Reference

### 👤 Authentication & User Routes (`/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/users/register` | Public | Register new account with validation |
| `POST` | `/api/users/login` | Public | Authenticate user & receive JWT token |
| `POST` | `/api/users/forgot-password` | Public | Request 6-digit OTP code to email |
| `POST` | `/api/users/reset-password` | Public | Reset password using verified OTP |
| `GET` | `/api/users` | Admin / Superadmin | Paginated list of users with search |
| `GET` | `/api/users/stats` | Admin / Superadmin | Registration trend & role breakdown |
| `PUT` | `/api/users/:id` | Admin / Superadmin | Update user information |
| `DELETE` | `/api/users/:id` | Superadmin | Permanently delete user |
| `PATCH` | `/api/users/:id/role` | Superadmin | Change user role (`user`, `admin`, `superadmin`) |

### 📦 Product & Inventory Routes (`/api/products`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Admin / Superadmin | List products (pagination, filter, sort) |
| `GET` | `/api/products/stats` | Admin / Superadmin | Inventory valuation & category breakdown |
| `POST` | `/api/products` | Admin / Superadmin | Create new product with validation |
| `PUT` | `/api/products/:id` | Admin / Superadmin | Update product details or stock |
| `DELETE` | `/api/products/:id` | Superadmin | Delete product entity |

---

## ⚙️ Getting Started Locally

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB Atlas account** or local MongoDB instance

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables (.env)
# Create a .env file with the following:
MONGODB_URI=your_mongodb_connection_string
PORT=5001
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
NODE_ENV=development

# Start backend server
npm run dev
```
> The backend will automatically start on `http://localhost:5001` and seed the default superadmin user.

### 3. Frontend Setup
```bash
# Navigate to frontend directory in a new terminal
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
> The frontend application will be live at `http://localhost:5173`.

---

## 🔑 Default Demo Credentials

You can immediately log in with the pre-seeded Superadmin account:

- **Email:** `admin@gmail.com`
- **Password:** `admin123`
- **Role:** `superadmin` (Full permissions)