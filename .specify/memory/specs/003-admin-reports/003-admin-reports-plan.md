# Implementation Plan: Admin Reports & Statistics Module

**Branch**: `003-admin-reports` | **Date**: 2026-06-22 | **Spec**: `.specify/memory/specs/003-admin-reports/003-admin-reports.md`

## Summary

Add an owner-only "التقارير" (Reports) tab to the existing admin page that displays system statistics and date-based queries. The implementation reuses the existing User model data (`createdAt`, `calculationsCount`, `lastLogin`) through a new `/api/reports` endpoint with MongoDB aggregation pipelines. The UI is a self-contained `ReportsTab` component with modular sub-sections for easy future extension.

## Technical Context

**Language/Version**: JavaScript (ES2022+) / Next.js App Router

**Primary Dependencies**: Next.js, React 19, Tailwind CSS, MongoDB/Mongoose, Zustand

**Storage**: MongoDB Atlas (existing connection via `src/lib/mongodb.js`)

**Testing**: Manual verification + `npm run build`

**Target Platform**: Web (responsive, Arabic RTL)

**Project Type**: Web application (full-stack Next.js)

**Performance Goals**: <2s initial load, <1s per query

**Constraints**: Owner-only access, no new npm dependencies, Arabic-first UI

**Scale/Scope**: ~5 stat cards, 1 date picker, 2 tables

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I: Arabic-First UX | PASS | All labels in Arabic, RTL layout, Arabic date formatting |
| II: Data Integrity & Security | PASS | `requireOwner` on API, server-side validation of date params |
| III: Performance & Offline | PASS | Aggregation pipelines are efficient; admin features don't need offline |
| IV: Code Quality & Testing | PASS | Modular components, follows existing admin patterns |
| V: Simplicity & Minimal Deps | PASS | Zero new dependencies, reuses existing User model |
| VI: Role-Based Access Control | PASS | Owner-only tab (UI) + owner-only API (`requireOwner`) |
| VII: Calculation Integrity | PASS | Read-only queries, no modification to calculations data |

All 7 principles PASS. No violations to justify.

## Project Structure

### Source Code (repository root)

```text
src/
├── app/
│   ├── admin/
│   │   └── page.jsx              # MODIFY: Add reports tab
│   └── api/
│       └── reports/
│           └── route.js          # NEW: Reports aggregation API
├── components/
│   ├── admin/
│   │   └── ReportsTab.jsx       # NEW: Self-contained reports component
│   └── Icons.jsx                # MODIFY: Add Chart icon
```

**Structure Decision**: Web application structure. New files follow existing conventions — API routes under `src/app/api/`, components under `src/components/`, page modifications in existing `src/app/admin/page.jsx`.

## Detailed Design

### API: `GET /api/reports`

Protected by `requireOwner`. Accepts `type` query parameter:

| type | Description | Response Shape |
|------|-------------|----------------|
| `overview` | Summary stats | `{ totalInvoices, totalAccounts, newToday, newWeek, newMonth }` |
| `accounts-by-date` | Accounts created on date | `{ date, count, accounts: [{ username, role, phone, officeName, createdAt }] }` |
| `invoice-leaderboard` | Users ranked by invoices | `{ users: [{ username, role, officeName, calculationsCount, lastLogin }] }` |

### MongoDB Aggregations

- **overview**: `$group` to sum `calculationsCount`, count total, and count by date ranges
- **accounts-by-date**: `$match` on `createdAt` date range (start/end of day), `$project` needed fields
- **invoice-leaderboard**: `$sort` by `calculationsCount: -1`, `$project` needed fields

### Component Architecture: `ReportsTab`

```
ReportsTab
├── OverviewCards (5 stat cards in grid)
├── DateReportSection (date picker + results table)
└── InvoiceLeaderboard (ranked table)
```

Each sub-section is a local function component within `ReportsTab.jsx` for modularity. Adding a new report section means adding a new function component and a new API case.

### Data Flow

```
AdminPage (tab === "reports")
  └── ReportsTab
        ├── fetch("/api/reports?type=overview") → OverviewCards
        ├── fetch("/api/reports?type=accounts-by-date&date=X") → DateReportSection
        └── fetch("/api/reports?type=invoice-leaderboard") → InvoiceLeaderboard
```

## Complexity Tracking

> No violations — all constitution principles pass.
