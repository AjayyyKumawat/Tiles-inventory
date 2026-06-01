# 🏢 Enterprise Tiles Inventory & Order Management OS

A professional-grade, full-stack Enterprise Resource Planning (ERP) platform designed specifically for tile retailers, wholesale distributors, and suppliers. This system features real-time inventory tracking, secure role-based access control (RBAC), sales order management, transaction auditing, and business analytics.

🌐 **Production Live Demo**: *[Add your live deployment link here, e.g., Vercel + Render]*

---

## ⚡ Engineering & Architecture Highlights
This platform was built to demonstrate modern full-stack engineering standards, prioritizing security, state management, and highly polished user experiences:

*   **Role-Based Access Control (RBAC)**: Secure backend middleware restricting actions based on roles (`Owner`, `Admin`, `Staff`). Route permissions are enforced on both the client (via React Router guards) and the API server.
*   **Database Transaction Syncing**: Changes to products and sales orders automatically sync to MongoDB collections while generating detailed transaction history inside a read-only system-wide audit trail.
*   **Optimistic State Updates**: Redux Toolkit is utilized for fluid, lag-free UI interactions, caching active sessions, and syncing state seamlessly with asynchronous API middleware.
*   **High-Fidelity UI/UX**: Implements a glassmorphic aesthetic built on a dark slate palette, using spring-physics micro-animations (`framer-motion`), customized statistical charts (`recharts`), and responsive layouts.
*   **Production Security**: Secured with JWT-based session tokens, hashed passwords (`bcryptjs`), CORS authorization policies, and automated token invalidation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Redux Toolkit, React Router 7, Tailwind CSS 4, Framer Motion, Recharts, Axios |
| **Backend** | Node.js, Express, MongoDB Atlas, Mongoose, JWT (JSON Web Tokens), Bcrypt.js |
| **Tooling** | Vite 8, ESLint 9, Git, npm |

---

## 📸 Key Features & Capabilities

*   **📦 Real-time Tile Inventory**: Manage stock (in boxes), brands, categories/sizes, reorder points, cost prices, and selling prices. Automated alert badges flash dynamically when items fall below low stock thresholds.
*   **🧾 Sales Orders (SO)**: Process outbound customer orders, auto-fill unit pricing from stock records, validate real-time quantity availability, and update inventory instantly upon fulfillment.
*   **👥 Staff Directory**: Complete administrative control for Owners and Admins to register new staff, manage credentials, edit details, or revoke workspace access.
*   **📈 Interactive Business Analytics**: Dynamic KPI dashboards summarizing total designs, box counts, restock priorities, sales margins, and revenue analytics.
*   **🔍 System Audit Logs**: A tamper-proof transaction log tracing every record addition, quantity update, order fulfillment, and user profile modification with detailed "before-and-after" status.
*   **📥 Enterprise CSV Exporting**: Export customized, pre-formatted CSV spreadsheets of your entire inventory, suppliers, or sales logs instantly.

---

## 🚀 Local Installation & Configuration

### Prerequisites
*   Node.js (v18 or higher)
*   MongoDB Atlas account or local MongoDB instance

### 1. Clone & Setup Workspace
```bash
git clone https://github.com/your-username/inventory-management-os.git
cd inventory-management-os
```

### 2. Configure Backend Server
Create a `.env` file in the `backend/` directory:
```bash
cd backend
touch .env
```
Add the following configuration:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_random_64_character_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
```
Install dependencies and seed the development database:
```bash
npm install
npm run dev # Starts backend server with Nodemon on port 5000
```
*(Note: The server will automatically seed initial demo accounts and product catalogs if connected to an empty collection).*

### 3. Configure Frontend Client
Return to the project root directory and set up the React client:
```bash
cd ..
npm install
```
Start the frontend development server:
```bash
npm run dev # Starts Vite bundler on port 5173
```
Open `http://localhost:5173` in your browser.

---

## 👥 Demo Credentials
You can immediately test the RBAC layers with these pre-seeded roles:

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Owner / Owner** | `admin@gmail.com` | `admin123` | Full administrative control, billing, settings, staff directory |
| **Staff Member** | `staff@company.com` | `password123` | Product listings, inventory levels, sales orders (restricted settings) |

---

## 🔒 Security & Code Standards
*   **No API Keys Committed**: Environment variables are strictly ignored (`.gitignore`).
*   **Linter Compliance**: High codebase hygiene adhering to strict ESLint configurations.
*   **Pure ESM**: The entire project operates on native ECMAScript Modules (`type: "module"`).
*   **Semantic Commits**: Follows Conventional Commits guidelines (`feat:`, `fix:`, `docs:`, `chore:`).

