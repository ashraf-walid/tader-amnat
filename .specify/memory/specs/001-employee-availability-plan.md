# Implementation Plan: Employee Availability (توفر الموظفين)

**Branch**: `001-employee-availability` | **Date**: 2026-06-16 | **Spec**: [001-employee-availability.md](./001-employee-availability.md)

## Summary

Build a customer-facing page (`/employees`) that displays Amanat staff available today, with one-click phone call and WhatsApp contact buttons. Extend the admin panel with a new "الموظفين" tab for full CRUD management of the employee availability list. New MongoDB collection `EmployeeAvailability` with a dedicated API and server component page.

## Technical Context

**Language/Version**: JavaScript (ES2022+) / Next.js 16.2.4 / React 19.2.4

**Primary Dependencies**: Next.js App Router, Mongoose 9.x, Tailwind CSS 4, Lucide Icons (already in project)

**Storage**: MongoDB Atlas (existing connection via `lib/mongodb.js`)

**Testing**: Manual testing (no test framework configured currently)

**Target Platform**: Web (mobile-first PWA, already configured with service worker)

**Project Type**: Full-stack web application (Next.js App Router)

**Performance Goals**: Page load < 2s on 4G; API response < 200ms

**Constraints**: Arabic RTL layout, dark/light theme support, mobile-first responsive design

**Scale/Scope**: ~10-20 employee entries max; accessed by all authenticated users

## Constitution Check

*GATE: Must pass before implementation.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Arabic-First UX | ✅ Pass | All UI text in Arabic, RTL layout, Arabic font stack |
| II. Data Integrity & Security | ✅ Pass | API auth required; admin-only for mutations; Mongoose schema |
| III. Performance & Offline | ✅ Pass | Lightweight page, no heavy bundles; works within existing PWA |
| IV. Code Quality | ✅ Pass | PascalCase components, camelCase hooks, follows existing patterns |
| V. Simplicity | ✅ Pass | No new dependencies; reuses existing Icons, auth, Mongoose |
| VI. Role-Based Access | ✅ Pass | All roles can view; only admin/owner can CRUD |
| VII. Domain Integrity | ⚠️ N/A | Not a calculation feature |

**No violations detected.**

## Project Structure

### Source Code (repository root)

```text
src/
├── models/
│   └── EmployeeAvailability.js          # NEW: Mongoose schema
├── app/
│   ├── api/
│   │   └── employees/
│   │       └── route.js                 # NEW: GET (auth) + POST (admin)
│   │       └── [id]/
│   │           └── route.js             # NEW: PUT (admin) + DELETE (admin)
│   ├── employees/
│   │   └── page.jsx                     # NEW: Customer-facing page (server component)
│   └── admin/
│       └── page.jsx                     # MODIFY: Add "الموظفين" tab
├── components/
│   ├── EmployeeCard.jsx                 # NEW: Employee card with call/WhatsApp buttons
│   └── Icons.jsx                        # MODIFY: Add new icons if needed (already has WhatsApp, Phone)
```

**Structure Decision**: Follow existing single-project Next.js App Router pattern. New files placed alongside existing models, API routes, and components.

## Detailed Design

### 1. Data Model: EmployeeAvailability

**File**: `src/models/EmployeeAvailability.js`

```javascript
// Mongoose Schema
{
  name:      { type: String, required: true, trim: true },    // Arabic display name
  phone:     { type: String, required: true, trim: true },    // Egyptian format: 01XXXXXXXXX
  role:      { type: String, required: true, trim: true },    // Job title (e.g., "خدمة عملاء")
  isActive:  { type: Boolean, default: true },                // Visibility toggle
  sortOrder: { type: Number, default: 0 },                    // Display order (lower = first)
  timestamps: true                                             // createdAt, updatedAt
}
```

**Indexes**:
- `isActive: 1, sortOrder: 1` — for customer query (active employees sorted)
- `sortOrder: 1` — for admin listing

### 2. API Endpoints

#### `src/app/api/employees/route.js`

| Method | Auth | Description |
|--------|------|-------------|
| `GET` | `requireAuth` | Returns all employees. For non-admin: only `{isActive: true}` sorted by `sortOrder`. For admin: all employees sorted by `sortOrder`. |
| `POST` | `requireAdmin` | Create new employee. Body: `{ name, phone, role, isActive?, sortOrder? }`. Validates phone format (Egyptian: `/^01[0-9]{9}$/`). |

#### `src/app/api/employees/[id]/route.js`

| Method | Auth | Description |
|--------|------|-------------|
| `PUT` | `requireAdmin` | Partial update. Body: any subset of `{ name, phone, role, isActive, sortOrder }`. |
| `DELETE` | `requireAdmin` | Delete employee by ID. |

**Response format** (consistent with existing APIs):
```json
// Success
{ "success": true, "employees": [...] }
{ "success": true, "employee": {...} }
{ "success": true, "message": "تم الحذف" }

// Error
{ "success": false, "error": "رسالة الخطأ" }
```

### 3. Customer-Facing Page: `/employees`

**File**: `src/app/employees/page.jsx`

- **Server Component**: Fetches active employees from MongoDB directly (same pattern as `Storagecalculator/page.jsx`)
- **Client Component**: `EmployeeCard` for each employee with call/WhatsApp buttons
- **Layout**: Mobile-first grid, 1 column on mobile, 2-3 columns on desktop
- **Empty state**: Friendly Arabic message when no employees available
- **Auth guard**: Server-side redirect to `/login` if not authenticated

**Employee Card Design**:
```
┌─────────────────────────────────────┐
│  ● متاح                    خدمة عملاء │
│                                     │
│  أحمد محمد                          │
│  ****-***-1234                      │
│                                     │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ 📞 اتصال │  │ 💬 واتساب       │ │
│  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────┘
```

**Phone masking logic** (FR-012):
- Display: `****-***-1234` (last 4 digits visible)
- Call button: `tel:01234567890` (full number)
- WhatsApp button: `https://wa.me/2001234567890?text=السلام عليكم...` (full number with Egypt country code `20`)

**WhatsApp URL format**:
```
https://wa.me/2{phone_without_leading_0}?text={encodeURIComponent("السلام عليكم، أنا عميل لدى أمانات وأحتاج مساعدة")}
```

### 4. Admin Panel Extension

**File**: `src/app/admin/page.jsx` (MODIFY)

Add a 4th tab: `"employees"` with icon `Icon.Users`.

**Admin tab features**:
- Table listing all employees (regardless of `isActive` status)
- Columns: Name, Phone, Role, Status (active/inactive badge), Sort Order, Actions (Edit/Delete)
- "إضافة موظف" button opens modal with form fields:
  - `name` (text, required, Arabic)
  - `phone` (text, required, validated: `/^01[0-9]{9}$/`)
  - `role` (text, required, job title)
  - `isActive` (toggle switch)
  - `sortOrder` (number, optional, default: 0)
- Quick toggle: Click on status badge to toggle `isActive` instantly (inline PATCH)
- Delete with confirmation modal (same pattern as accounts delete)
- Reuses existing `Modal`, `Btn`, `Field`, `Input`, `Toast` components from admin page

### 5. Navigation Update

**File**: `src/components/AdminNav.jsx` (MODIFY)

Add to `NAV_ITEMS` array:
```javascript
{ href: '/employees', label: 'الموظفين المتاحين', icon: NavUsersIcon, exactMatch: true, roles: ['owner', 'admin', 'employee', 'client'] }
```

Position: After `/client/balance` and before `/Storagecalculator/rates`.

### 6. Icons

Already available in `Icons.jsx`:
- `WhatsAppIcon` ✅
- `PhoneIcon` ✅
- `UsersIcon` ✅

May need to add:
- `NavUsersIcon` — a distinct icon for the nav item (or reuse `UsersIcon`)
- `ToggleIcon` — for the isActive toggle in admin (or use a simple CSS toggle switch)

## Data Flow

```
Customer Page (/employees)          Admin Panel (/admin → employees tab)
        │                                     │
        ▼                                     ▼
  Server Component                    Client Component
  (fetch from MongoDB)                (fetch from API)
        │                                     │
        ▼                                     ▼
  EmployeeAvailability              GET  /api/employees (all)
  .find({isActive:true})            POST /api/employees (create)
  .sort({sortOrder:1})              PUT  /api/employees/[id] (update)
                                    DELETE /api/employees/[id] (delete)
        │                                     │
        ▼                                     ▼
  Render EmployeeCards              Render admin table + modals
  with tel: and wa.me links         with inline toggle + CRUD
```

## Complexity Tracking

No constitution violations. No additional complexity justification needed.
