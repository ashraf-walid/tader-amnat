# Reverse Engineering Report — Amanat Project

**Date:** 2026-06-16
**Status:** Complete

---

## 1. Project Overview

**Amanat** (أمانات) is an Arabic-first intelligent accounting and financial analysis system. It serves as a dashboard for viewing client account balances, managing financial data, and calculating container storage fees (ground rent) for shipping containers at ports.

- **Name:** amanat
- **Version:** 0.1.0
- **Language:** Arabic (RTL) with English code
- **Domain:** Financial accounting / Container storage invoicing

---

## 2. Technology Stack

| Layer            | Technology                          | Version   |
|------------------|-------------------------------------|-----------|
| Framework        | Next.js (App Router)                | 16.2.4    |
| UI Library       | React                               | 19.2.4    |
| Styling          | Tailwind CSS                        | 4.x       |
| State Management | Zustand (persist)                   | 5.0.14    |
| Database         | MongoDB Atlas (Mongoose ODM)        | 9.6.2     |
| Auth             | JWT (jose + jsonwebtoken + bcrypt)  | 6.x/9.x/6.x |
| Offline/PWA      | Dexie (IndexedDB) + Service Worker  | 4.4.3     |
| Analytics        | Microsoft Clarity                   | x80sprsik2 |
| Fonts            | Alexandria (Arabic) + Outfit (Latin)| Google Fonts |
| Icons            | lucide-react                        | 1.14.0    |
| Date Handling    | date-fns                            | 4.1.0     |
| Keyboard Layout  | convert-layout                      | 0.11.1    |
| CSS Utilities    | clsx + tailwind-merge               | 2.x / 3.x |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    PWA Shell                         │
│  manifest.json + sw.js + ServiceWorkerRegister       │
├─────────────────────────────────────────────────────┤
│                  Next.js App Router                  │
├──────────────┬──────────────┬───────────────────────┤
│   Pages      │   API Routes │   Components          │
│  (SSR/CSR)   │  (Next.js)   │  (React)              │
├──────────────┼──────────────┼───────────────────────┤
│ login/       │ auth/*       │ dashboard/*           │
│ page.js (/)  │ accounts/*   │ storage-calculator/*  │
│ admin/       │ data/*       │ ClientBalance         │
│ client/      │ settings     │ ArabicDatePicker      │
│ Storagecalc/ │ attempts/use │ ThemeToggle           │
│              │ cache/stats  │ AdminNav              │
│              │ calculator/  │ Icons                 │
├──────────────┴──────────────┴───────────────────────┤
│                   Hooks Layer                        │
│  useAccountData · useSearch · usePendingChanges      │
│  useStorageCalculator                                │
├─────────────────────────────────────────────────────┤
│                   State (Zustand)                    │
│  useCalculatorStore · useSearchStore                 │
├─────────────────────────────────────────────────────┤
│                   Libraries                          │
│  auth · cache · mongodb · localDB · parser           │
│  search-utils · storageCalculator · storageConstants │
│  constants · adminConstants                          │
├─────────────────────────────────────────────────────┤
│                   Models (Mongoose)                  │
│  User · AccountData · Settings                       │
├─────────────────────────────────────────────────────┤
│              MongoDB Atlas (Remote)                  │
│       + IndexedDB / Dexie (Client-Side Cache)       │
└─────────────────────────────────────────────────────┘
```

---

## 4. Authentication & Authorization

### Flow
1. User submits credentials at `/login`
2. `POST /api/auth/login` validates against MongoDB, checks `isActive`
3. On success: decrements login attempts on failure, generates JWT (7-day expiry)
4. JWT stored as HTTP-only cookie (`auth-token`)
5. JWT payload: `{ userId, id, username, role, accountCode }`

### Roles & Access Levels

| Role      | Access                                                              |
|-----------|---------------------------------------------------------------------|
| **owner** | Full admin access + cannot be deleted                               |
| **admin** | Full admin access (accounts CRUD, data upload, settings, cache)     |
| **employee** | Dashboard (`/`), storage calculator, admin nav                   |
| **client** | Client balance page (`/client/balance`) — sees only own data via `accountCode` from JWT |

### Auth Utilities (`src/lib/auth.js`)
- `requireAuth(req)` — verifies JWT, returns decoded payload
- `requireAdmin(req)` — checks role is admin/owner/employee
- `AuthError` / `ForbiddenError` — custom error classes
- Token source: cookies (primary) or Cookie header (fallback)

### Login Attempt Lockout
- Each user has `attempts` field (default: 5)
- Failed login decrements attempts
- When attempts reach 0, account is locked (but quota enforcement on `/api/attempts/use` is currently commented out)
- Admin can reset attempts via `PATCH /api/accounts/[id]/attempts`

---

## 5. API Endpoints Map

### Auth
| Method | Endpoint              | Auth       | Description                        |
|--------|-----------------------|------------|------------------------------------|
| POST   | `/api/auth/login`     | Public     | Login, set JWT cookie              |
| POST   | `/api/auth/logout`    | Public     | Clear auth cookie                  |
| GET    | `/api/auth/me`        | Auth       | Current user info                  |

### Accounts Management
| Method | Endpoint                       | Auth   | Description                     |
|--------|--------------------------------|--------|---------------------------------|
| GET    | `/api/accounts`                | Admin  | List all accounts (5min cache)  |
| POST   | `/api/accounts`                | Admin  | Create user (bcrypt password)   |
| PUT    | `/api/accounts/[id]`           | Admin  | Partial update (manual bcrypt)  |
| DELETE | `/api/accounts/[id]`           | Admin  | Delete user (prevents owner)    |
| PATCH  | `/api/accounts/[id]/attempts`  | Admin  | Update login attempts           |

### Financial Data
| Method | Endpoint                    | Auth   | Description                              |
|--------|-----------------------------|--------|------------------------------------------|
| GET    | `/api/data`                 | Admin  | All AccountData sorted by accountCode    |
| POST   | `/api/data`                 | Admin  | Replace ALL data (deleteMany+insertMany) |
| PATCH  | `/api/data/[accountCode]`   | Admin  | Update transactions for specific account |

### Settings & Utilities
| Method | Endpoint                  | Auth     | Description                          |
|--------|---------------------------|----------|--------------------------------------|
| GET    | `/api/settings`           | Public   | Exchange rate (24h cache, default:53)|
| PUT    | `/api/settings`           | Admin    | Update exchange rate                 |
| GET    | `/api/cache/stats`        | Admin    | Cache statistics                     |
| DELETE | `/api/cache/stats`        | Admin    | Clear all caches                     |
| GET    | `/api/calculator/init`    | Auth     | Remaining attempts for calculator    |
| GET    | `/api/client/balance`     | Auth     | Client's own balance (via JWT code)  |
| POST   | `/api/attempts/use`       | Auth     | Decrement attempts + increment calc  |

---

## 6. Data Models

### User (`src/models/User.js`)
```
username      String (unique, lowercase, trimmed)
password      String (bcrypt hashed via pre-save hook)
phone         String
officeName    String
accountCode   Number (links to AccountData)
role          Enum: owner | admin | employee | client
attempts      Number (default: 5)
calculationsCount Number (default: 0)
lastLogin     Date
isActive      Boolean (default: true)
```
**Indexes:** createdAt, role, accountCode, isActive+attempts (compound), username+role (compound)

### AccountData (`src/models/AccountData.js`)
```
account        String (account name)
accountCode    String
openingBalance { debit: Number, credit: Number }
totals         { debit: Number, credit: Number }
closingBalance { debit: Number, credit: Number }
transactions   [{ type: String, amount: Number, date: Date }]
```
**Indexes:** accountCode, account (text), transactions.date, compound

### Settings (`src/models/Settings.js`)
```
key    String (unique)
value  Mixed
```
Used for: `exchange_rate`, `date_range`

---

## 7. Pages & Routes

| Route                        | Type    | Auth     | Description                              |
|------------------------------|---------|----------|------------------------------------------|
| `/` (page.js)                | Client  | Employee+| Main dashboard: accounts table, search   |
| `/login`                     | Client  | Public   | Login page with role-based redirect      |
| `/admin`                     | Client  | Admin    | Admin panel (3 tabs: accounts, rate, data)|
| `/client/balance`            | Server  | Client   | Client's own balance view                |
| `/Storagecalculator`         | Server  | Auth     | Storage fee calculator                   |
| `/Storagecalculator/rates`   | Server  | Public   | Public rates reference page              |

### Login Redirect Logic
- owner/admin → `/admin`
- employee → `/`
- client → `/client/balance`
- default → `/Storagecalculator`

---

## 8. Core Features

### 8.1 Accounts Dashboard (`/`)
- Displays financial data from uploaded HTML trial balance exports
- **Search:** Arabic-aware with keyboard transliteration (Windows + Mac layouts), 200ms debounce
- **Views:** Desktop table + Mobile card layout
- **Transaction editing:** Inline manual additions/deductions per account
- **Transaction history modal:** Detailed view per account
- **File upload:** Drag-and-drop zone for HTML/JSON files
- **Backup download:** Export current data as JSON

### 8.2 Admin Panel (`/admin`)
- **Tab 1 — Accounts:** Full CRUD, search/filter, sortable columns, stats cards
- **Tab 2 — Exchange Rate:** Update USD→EGP rate
- **Tab 3 — Data Management:** Upload HTML exports, view project structure
- Delete confirmation requires typing username
- Uses `adminConstants.js` for project file documentation and role definitions

### 8.3 Storage Calculator (`/Storagecalculator`)
Complex invoicing system for container storage fees:

**Container Types:**
- 20ft / 40ft
- Full (standard) / Reefer (refrigerated) / Dangerous / Non-Standard (OOG, Lashing)

**Billing:**
- Initial (includes grace period) / Renewal (no grace if after 5 days)

**Special Features:**
- Holiday release: +50% surcharge
- Cargo stripping (تفريغ المشمول)
- Danger yard storage (tiered pricing)
- Cargo storage (أرضيات المشمول) — 2x rate, 1-day grace
- External storage — 0 grace period
- LCL storage — 3-day grace, half cargo service rate
- Exchange rate override

**Calculation Pipeline (`storageCalculator.js`):**
1. `calculateDaysBetweenDates()` — inclusive day count
2. `validateInputs()` — tier gap/overlap detection
3. `calculateStorageFee()` — grace period + tiered pricing per container
4. `calculateServiceFee()` — fixed fees + additional services (crane, yard shifting)
5. `convertToEGP()` — USD→EGP conversion
6. `calculateTaxAndStamps()` — 14% VAT + 5 EGP martyr stamp, ceiling rounding
7. `calculateMultiContainerInvoice()` / `calculateFinalInvoice()` — orchestrators

**Pricing Config (`storageConstants.js`):**
- VAT: 14%
- Martyr stamp: 5 EGP fixed
- 20ft Full: 5-day grace → $8/day (d6-20) → $12/day (d21+)
- 40ft Full: 5-day grace → $14/day (d6-20) → $21/day (d21+)
- Reefer: 0 grace, 3 tiers
- Dangerous: 0 grace, 2 tiers
- Non-standard: OOG = 2x multiplier, Lashing = 4x multiplier

### 8.4 Client Balance (`/client/balance`)
- Authenticated client sees own balance
- Uses `accountCode` from JWT to fetch matching AccountData
- Gracefully handles missing accountCode

---

## 9. Caching Strategy

### Server-Side: MemoryCache (`src/lib/cache.js`)
- Map-based with TTL and auto-cleanup every 5 minutes
- **Cache Keys:**
  - `settings:exchange_rate` — 24h TTL
  - `accounts:all` — 5min TTL
  - `data:page:*` — 3min TTL
- Pattern-based invalidation (`invalidateCache('accounts:*')`)

### Client-Side: IndexedDB via Dexie (`src/lib/localDB.js`)
- Database name: `amanat_db`
- **Tables:**
  - `accounts` (PK: accountCode) — all account data
  - `metadata` (PK: key) — lastSync, dateRange
- **Operations:** getAllAccounts, searchAccounts, getAccountsPaginated, saveAllAccounts, updateAccount, updateTransactions, clearAllData
- **Stats:** getDatabaseStats with storage estimate

### Data Flow (Smart Loading)
```
1. Check IndexedDB → if fresh data exists, use it immediately
2. Fallback to MongoDB API fetch
3. Save to IndexedDB immediately
4. Update UI
5. Sync to MongoDB in background (on mutations)
```

---

## 10. Arabic-First Features

- **RTL layout:** `dir="rtl"` on root, `lang="ar"` on HTML
- **Fonts:** Alexandria (Arabic primary) + Outfit (Latin fallback)
- **Keyboard transliteration:** Windows Arabic layout mapping + convert-layout library (Mac)
- **Normalization:** Alef/Yaa/Taa Marbuta/Waw normalization, tatweel removal
- **HTML parser:** windows-1256 encoding support for Arabic accounting exports
- **Theme:** Dark/light with sync `dangerouslySetInnerHTML` script to prevent FOUC
- **All UI text in Arabic**

---

## 11. File Upload & Parsing Pipeline

1. User uploads HTML file (trial balance export from legacy accounting system)
2. `parser.js` reads with windows-1256 encoding
3. Extracts: date range, account name/code, opening/totals/closing balances
4. Filters by `PRIORITY_CODES` list (~100 specific account codes)
5. Returns structured JSON array
6. `useAccountData` hook: saves to IndexedDB → updates UI → syncs to MongoDB
7. JSON backup files also supported for restore

---

## 12. State Management

### Zustand Stores (persisted to localStorage)
- **useCalculatorStore** (`calculator-storage`): calculator result state
- **useSearchStore** (`search-storage`): search text + transactions-only filter

### Custom Hooks
- **useAccountData** (346 lines): Core data management — smart loading, file processing, write strategy, drag-and-drop, backup, transaction commit
- **useSearch** (107 lines): Debounced Arabic-aware search with keyboard detection
- **usePendingChanges** (32 lines): Pending manual additions/deductions per account
- **useStorageCalculator** (468 lines): Full calculator logic with all container types, billing, services, exchange rate override

---

## 13. Component Inventory

### Dashboard (`src/components/dashboard/`)
- `AccountCard.jsx` — Mobile card view for accounts
- `AccountsTable.jsx` — Desktop table view
- `DashboardHeader.jsx` — Header with stats, refresh, download
- `FileUploadZone.jsx` — Drag-and-drop upload area
- `SearchBar.jsx` — Arabic-aware search with keyboard toggle
- `TransactionModal.jsx` — Transaction history detail modal

### Storage Calculator (`src/components/storage-calculator/`)
- `AdvancedOptions.jsx` — Holiday release, cargo, external, LCL toggles
- `BillingTypeSelector.jsx` — Initial/Renewal selector
- `CalculateButton.jsx` — Calculate action with attempt consumption
- `CargoTypeSelector.jsx` — Full/Reefer/Dangerous/Non-Standard selector
- `ContainerCountInput.jsx` — Container count input
- `DatePickerSection.jsx` — Arrival/Release date pickers
- `ExchangeRateEditor.jsx` — Override exchange rate
- `ResultSection.jsx` — Invoice result display

### Shared (`src/components/`)
- `AdminNav.jsx` — Navigation bar for admin/employee
- `ArabicDatePicker.jsx` — Localized date picker
- `ClientBalance.jsx` — Client balance display component
- `Icons.jsx` — Custom SVG icons
- `ServiceWorkerRegister.jsx` — PWA service worker registration
- `ThemeToggle.jsx` — Dark/light theme toggle

---

## 14. Utility Scripts (`scripts/`)
- `create-owner.js` — Seed script to create initial owner account
- `extract-codes.js` — Extract account codes from data
- `test-id.js` — Test account ID validation

---

## 15. Configuration Files
- `.env.local` — Environment variables (MongoDB URI, JWT secret, etc.)
- `next.config.mjs` — Next.js configuration
- `eslint.config.mjs` — ESLint 9 flat config
- `postcss.config.mjs` — PostCSS for Tailwind
- `jsconfig.json` — Path aliases (`@/` → `src/`)
- `public/manifest.json` — PWA manifest
- `public/sw.js` — Service worker

---

## 16. Key Design Patterns

1. **Smart Offline-First Loading:** IndexedDB → API fallback → background sync
2. **Arabic Keyboard Abstraction:** Multiple transliteration strategies for cross-platform search
3. **Tiered Pricing Engine:** Configurable grace periods + tier brackets with gap/overlap validation
4. **Multi-Container Invoice Orchestrator:** Handles mixed container sizes/types in single invoice
5. **Role-Based Route Guarding:** Login redirect + API-level auth checks
6. **Atomic Operations:** MongoDB `$inc` for attempt decrements and calculation counts
7. **Optimistic UI Updates:** Save to IndexedDB immediately, sync to server in background
8. **Server Memory Cache:** TTL-based with pattern invalidation for hot data

---

## 17. Known Issues / Notes

- Quota enforcement on `/api/attempts/use` is commented out (no block when attempts ≤ 0)
- Account update uses `findByIdAndUpdate` to bypass pre-save bcrypt hook (manual hashing)
- `PRIORITY_CODES` and `OTHER_CODES` are hardcoded lists (~100 + ~120 codes)
- Export container rates (`EXPORT`) are placeholder with empty TIERS
- Default exchange rate fallback: 53 EGP/USD
- `dangerouslySetInnerHTML` used for theme script and Clarity analytics
