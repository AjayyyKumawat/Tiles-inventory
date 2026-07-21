# 🧱 Tiles Inventory & Order Management System

I built this because a relative runs a tile distribution business and was tracking everything in WhatsApp messages and paper ledgers. This is a full-stack ERP that replaced that — real-time stock tracking, sales orders, staff access control, and a full audit trail of every change made.

🔗 **Live Demo:** [tiles-inventory-alpha.vercel.app](https://tiles-inventory-alpha.vercel.app/)

---

## 📸 Preview

> _Drop a screenshot or GIF of the dashboard here — drag and drop into this file on GitHub_

---

## ⚡ Performance (Lighthouse)

| Metric | Score |
|:---|:---|
| **Performance Score** | 🟢 21/22 |
| **Total Blocking Time** | 30 ms |
| **Interaction to Next Paint** | 60 ms |
| **Cumulative Layout Shift** | 0 |

- **2,759 modules** transformed and tree-shaken by Vite
- **Route-level code splitting** — each page loads as a separate chunk (e.g. Inventory: 30 KB, SalesOrders: 25 KB, Dashboard: 345 KB)
- Total CSS bundle: **59 KB → 10.5 KB gzipped**
- Full production build completes in **3.73 seconds**

---

## ✨ Features

- 📦 **Real-time Inventory** — track stock (in boxes), brands, categories, reorder points, cost & selling prices with automated low-stock alert badges
- 🧾 **Sales Orders** — process customer orders, auto-fill pricing from stock, validate availability, and update inventory on fulfillment
- 👥 **Staff Directory** — Owners and Admins can register staff, manage credentials, edit profiles, or revoke workspace access
- 👤 **Customers & Suppliers** — full CRUD management for business contacts
- 📈 **Business Analytics** — KPI dashboards for designs, box counts, restock priorities, sales margins, and revenue
- 🔍 **Audit Logs** — tamper-proof transaction log tracing every change with before-and-after status
- 📥 **CSV Export** — export inventory, supplier, or sales data as formatted spreadsheets instantly

---

## 🛠️ Tech Stack

| Layer | Technologies |
|:---|:---|
| **Frontend** | React 19, Redux Toolkit, React Router 7, Tailwind CSS 4, Framer Motion, Recharts, Axios |
| **Backend** | Node.js, Express.js, MongoDB Atlas, Mongoose |
| **Auth & Security** | JWT, Bcrypt.js, CORS policies |
| **Tooling** | Vite 8, ESLint 9, Git, npm |

---

## 🏗️ Architecture Highlights

- **Role-Based Access Control (RBAC)** — `Owner`, `Admin`, and `Staff` roles enforced on both React Router guards and Express middleware; permissions checked on every API request
- **26 REST API Endpoints** across 7 resource types (Auth, Users, Products, Customers, Suppliers, Sales Orders, Audit Logs)
- **Optimistic UI Updates** — Redux Toolkit caches sessions and syncs state with async API calls for a lag-free experience
- **Database Transaction Syncing** — every product and order change auto-syncs to MongoDB while appending a read-only audit trail entry
- **Production Security** — JWT session tokens, bcrypt-hashed passwords, CORS policies, and automated token invalidation
- **High-Fidelity UI** — glassmorphic dark slate design with spring-physics micro-animations (Framer Motion) and custom statistical charts (Recharts)

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account or local MongoDB instance

### 1. Clone the repo

```bash
git clone https://github.com/AjayyyKumawat/Tiles-inventory.git
cd Tiles-inventory
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `/backend`:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_64_character_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

```bash
npm run dev   # Starts backend on port 5000 (auto-seeds demo data on first run)
```

### 3. Set up the frontend

```bash
cd ..
npm install
npm run dev   # Starts Vite on http://localhost:5173
```

---

## 👥 Demo Credentials

Test all access levels instantly:

| Role | Email | Password | Access |
|:---|:---|:---|:---|
| **Owner** | `admin@gmail.com` | `admin123` | Full control — settings, staff, billing |
| **Staff** | `staff@company.com` | `password123` | Inventory & sales orders (restricted settings) |

---

## 📁 Project Structure

```
Tiles-inventory/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level views (code-split per page)
│   │   ├── store/        # Redux Toolkit slices & store
│   │   └── App.jsx
├── backend/              # Express.js API
│   ├── models/           # Mongoose schemas
│   ├── routes/           # 26 REST endpoints across 7 resources
│   ├── middleware/       # Auth & RBAC middleware
│   └── server.js
```

---

## 🔒 Code Standards

- **No secrets committed** — all keys in `.env`, strictly `.gitignore`'d
- **Pure ESM** — native ECMAScript Modules throughout (`type: "module"`)
- **Linter compliant** — strict ESLint 9 configuration
- **Semantic commits** — `feat:`, `fix:`, `docs:`, `chore:` conventions

---

## 🙋‍♂️ Author

**Ajay Kumawat**
- GitHub: [@AjayyyKumawat](https://github.com/AjayyyKumawat)
- LinkedIn: [Ajay Kumawat](https://www.linkedin.com/in/AjayyyKumawat/)
- Email: ajaykumawat1703@gmail.com
