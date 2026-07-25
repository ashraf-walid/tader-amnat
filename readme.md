# ⚓ Amanat (Tader-Amnat) — SaaS PWA

An enterprise-grade, offline-first Web App and Shipping Storage Invoicing system custom-tailored for port client accounts and shipping operators at **Damietta Port (ميناء دمياط)**. 

Built on a modern stack using **Next.js**, **React 19**, **Mongoose (MongoDB)**, **IndexedDB (Dexie.js)**, and **Service Workers**, the platform delivers a reliable desktop-like experience under poor connectivity conditions (like marine docks), featuring automated client balance tracking and real-time push notifications.

---

## 🔑 Recruiter Demo Access

To test or inspect the administration controls, client lists, analytics dashboards, and calculators:
* **Username:** `admin`
* **Password:** `123`

---

## 🚀 Key Features

### 1. 🧮 Port Demurrage & Storage Calculation Engine
* **Flexible Invoicing:** Computes complex storage fees for 20-foot & 40-foot containers using a tiered pricing structure.
* **Surcharges & Multipliers:** Accounts for Reefer demurrage, Danger Yard surcharges (1.5x rates), external warehousing, and LCL calculations (custom grace periods of 3 days instead of 5).
* **Additional Services:** Includes on-demand crane rental (ونش), cargo stripping (تفريغ المشمول), and manual service quantities.
* **Egypt Taxes & Stamps:** Automatically appends Egyptian VAT (14%) and the Martyr Stamp fee (5 EGP), rounding up to the nearest EGP.
* **Exchange Rate Overrides:** Features customizable admin exchange rates (USD to EGP) with optional manual overrides.

### 2. 📲 Offline-First PWA Capabilities
* **Local Transactions Cache:** Synthesizes client financial reports, invoices, and transaction queues on the client-side using **Dexie.js (IndexedDB)**.
* **Arabic Search Indexer:** Implements specialized Arabic text normalization to allow instant autocomplete and searches over account data entirely offline.
* **iOS PWA Support:** Detects environment standalone modes and includes automated setup prompts tailored to Apple device restrictions.

### 3. 🔔 Automated Web Push Notifications
* **Instantly Triggered Updates:** Hooks directly into bulk files uploading and manual backend updates.
* **Real-time Balance Alerts:** Sends browser push notifications using the **Web Push Protocol** to alert clients if their balance updates (crediting/debiting accounts).
* **Device Mapping:** Keeps track of active subscription VAPID key registration records linked to User profiles.

### 4. 📊 Admin Reporting & Visit Analytics
* **Account Analytics:** Admin panel tables displaying who has registered, remaining calculator attempt rates, and active PWA installation status.
* **Localized Heatmaps:** Global page-visit tracker routing technical metrics and presenting user-friendly Arabic names map charts.

---

## 🛠️ Technology Stack

* **Framework:** Next.js 16/15 (App Router), React 19, Tailwind CSS v4.
* **Client Database:** Dexie.js (IndexedDB interface), Zustand (State management).
* **Server Database:** MongoDB and Mongoose ORM.
* **Session Security:** JWT (Jose & Jsonwebtoken), bcrypt.
* **Background Tasks:** Web Push Server SDK.

---

## ⚙️ Project Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/amanat
JWT_SECRET=your_jwt_secret_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_MAILTO=mailto:example@domain.com
```

### 3. Running Locally
```bash
# Start Next.js development server
npm run dev
```

---

## 📂 Core Directory Structure

```
├── public/                 # Service Worker, PWA manifest, assets
├── src/
│   ├── app/                # Next.js Pages and API endpoints
│   │   ├── admin/          # Admin Dashboard Panels
│   │   ├── api/            # JSON Bulk Upload & Notification Routers
│   │   └── Storagecalculator/
│   │                       # Port storage rates billing interface
│   ├── components/         # Reusable Core UI (Tables, Modals, Forms)
│   ├── hooks/              # Custom React Hooks (Analytics, calculations)
│   ├── lib/                # Storage calculators, Dexie DB, push handlers
│   └── models/             # Mongoose Schemas (User, PushSubscription)
```
