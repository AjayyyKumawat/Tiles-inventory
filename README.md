# Tiles Inventory & Order Management System

I built this because a relative runs a tile distribution business and was tracking everything in WhatsApp messages and paper ledgers. This is a full-stack ERP that replaced that — real-time stock tracking, sales orders, staff access control, and a full audit trail of every change made.

**Live:** https://tiles-inventory-alpha.vercel.app/
&nbsp;&nbsp;|&nbsp;&nbsp; Login: `admin@gmail.com` / `admin123`

---

## What it does

The system handles the full cycle of a tile business:

- **Inventory** — track stock in boxes, manage brands/categories/sizes, set reorder points. Badges flash automatically when items go below threshold.
- **Sales Orders** — create outbound orders, auto-fills unit price from stock records, validates quantity before confirming, deducts inventory on fulfillment.
- **Customers & Suppliers** — full contact management linked to orders and purchase records.
- **Reports** — revenue, margins, restock priorities, and sales trends. Built with Recharts, filters by date range.
- **Audit Log** — every action (product added, order placed, user modified) is logged with a before/after snapshot. Read-only, tamper-proof.
- **Staff Access (RBAC)** — three roles: Owner, Admin, Staff. Permissions enforced on both the React Router layer and every Express endpoint. A Staff user literally cannot hit an Owner-only API route.
- **CSV Export** — one click exports for inventory, suppliers, or sales history.

---

## Tech

| | |
|:---|:---|
| Frontend | React 19, Redux Toolkit, React Router 7, Tailwind CSS v4, Framer Motion, Recharts, Axios |
| Backend | Node.js, Express.js, MongoDB Atlas, Mongoose |
| Auth | JWT + bcrypt, CORS, auto token invalidation |
| Build | Vite 8, ESLint 9 |

26 REST endpoints across 7 resources (Auth, Users, Products, Customers, Suppliers, Sales Orders, Audit Logs).

---

## Performance

Ran Lighthouse on the deployed build:

- Performance score: **21/22**
- Total Blocking Time: **30ms**
- Interaction to Next Paint: **60ms**
- Cumulative Layout Shift: **0**

Vite splits every route into its own chunk so users only load what they open. The heaviest page (Dashboard with all the charts) is 345 KB raw / 97 KB gzipped. Everything else is under 32 KB. Full build: 2,759 modules in 3.73s.

---

## Running locally

You'll need Node 18+ and a MongoDB connection string (Atlas free tier works).

```bash
git clone https://github.com/AjayyyKumawat/Tiles-inventory.git
cd Tiles-inventory
```

**Backend:**
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=your_connection_string
JWT_SECRET=any_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

```bash
npm run dev   # seeds demo data automatically on first run
```

**Frontend** (new terminal):
```bash
cd ..
npm install
npm run dev   # http://localhost:5173
```

**Demo accounts:**

| Role | Email | Password |
|:---|:---|:---|
| Owner | admin@gmail.com | admin123 |
| Staff | staff@company.com | password123 |

---

## A few decisions worth noting

**Why Redux Toolkit over Context?** The app has several async flows that touch the same state — a sales order fulfillment updates inventory, generates an audit log entry, and refreshes the dashboard KPIs simultaneously. Context would have meant prop-drilling or multiple nested providers. RTK's slice pattern kept that clean.

**Why route-level code splitting?** The Dashboard imports Recharts and Framer Motion which together push it past 300 KB. Splitting by route means the Login and Inventory pages load in under 30 KB — users who never open Reports never download that code.

**RBAC on both ends** — frontend guards alone are cosmetic security. Every sensitive route in Express checks the JWT role independently so the API is safe even if someone bypasses the UI.

---

## Structure

```
Tiles-inventory/
├── client/
│   └── src/
│       ├── components/   # shared UI
│       ├── pages/        # one file per route, each code-split
│       ├── store/        # RTK slices
│       └── App.jsx
└── backend/
    ├── models/
    ├── routes/           # 26 endpoints, 7 resource files
    ├── middleware/       # auth + role checks
    └── server.js
```

---

Ajay Kumawat — [LinkedIn](https://www.linkedin.com/in/ajay-kumawat-17a310292/) · ajaykumawat1703@gmail.com
