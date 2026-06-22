# Tasks: Admin Reports & Statistics Module

**Input**: Design documents from `.specify/memory/specs/003-admin-reports/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundation (Shared Infrastructure)

**Purpose**: API route and icon that all stories depend on.

- [ ] T001 Create `src/app/api/reports/route.js` with `requireOwner` auth and `GET` handler supporting `type` query param (overview, accounts-by-date, invoice-leaderboard) using MongoDB aggregation pipelines on the User model.
- [ ] T002 [P] Add `Chart` icon to `src/components/Icons.jsx` and register it in the `Icon` object.

**Checkpoint**: API responds correctly for all 3 types when called with owner credentials. Non-owner requests return 403.

---

## Phase 2: User Story 1 - Overview Statistics Dashboard (Priority: P1) MVP

**Goal**: Display 5 summary stat cards with real-time system metrics.

**Independent Test**: Navigate to admin > التقارير and verify all stat cards show correct counts.

### Implementation for User Story 1

- [ ] T003 [US1] Create `src/components/admin/ReportsTab.jsx` with OverviewCards sub-component that fetches `/api/reports?type=overview` and displays 5 stat cards (total invoices, total accounts, new today, new this week, new this month).
- [ ] T004 [US1] Add "التقارير" tab to `src/app/admin/page.jsx` tabs array (owner-only condition) and render `<ReportsTab />` when `tab === "reports"`.

**Checkpoint**: Owner sees stat cards with correct data. Non-owner doesn't see the tab.

---

## Phase 3: User Story 2 - Date-Based Account Report (Priority: P2)

**Goal**: Select a date and view accounts created on that date.

**Independent Test**: Pick a date from the date picker, verify the table shows only accounts from that date.

### Implementation for User Story 2

- [ ] T005 [US2] Add DateReportSection sub-component to `ReportsTab.jsx` with date input and results table that fetches `/api/reports?type=accounts-by-date&date=YYYY-MM-DD`.

**Checkpoint**: Date picker works, results table shows correct accounts for the selected date.

---

## Phase 4: User Story 3 - Invoice Leaderboard (Priority: P3)

**Goal**: Ranked table of users by invoice count.

**Independent Test**: Verify leaderboard shows users sorted by calculationsCount descending.

### Implementation for User Story 3

- [ ] T006 [US3] Add InvoiceLeaderboard sub-component to `ReportsTab.jsx` that fetches `/api/reports?type=invoice-leaderboard` and displays a ranked table.

**Checkpoint**: Leaderboard loads and shows users in correct order with role badges.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification.

- [ ] T007 Run `npm run build` and verify zero errors.

---

## Dependencies & Execution Order

- **Phase 1**: No dependencies — start immediately. T001 and T002 can run in parallel.
- **Phase 2 (US1)**: Depends on T001 (API) and T002 (Icon). MVP deliverable.
- **Phase 3 (US2)**: Depends on Phase 2 (ReportsTab file exists).
- **Phase 4 (US3)**: Depends on Phase 2 (ReportsTab file exists). Can parallel with Phase 3.
- **Phase 5**: Depends on all implementation phases complete.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundation
2. Complete Phase 2: Overview Stats
3. **STOP and VALIDATE**: Owner can see stat cards
4. Deploy if ready

### Incremental Delivery

1. Foundation → Overview cards (MVP!)
2. Add date report → Test independently
3. Add leaderboard → Test independently
4. Build verification → Ship
