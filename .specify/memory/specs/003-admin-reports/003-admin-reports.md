# Feature Specification: Admin Reports & Statistics Module

**Feature Branch**: `003-admin-reports`

**Created**: 2026-06-22

**Status**: Draft

**Input**: User description: "إنشاء مديول جديد فى صفحة الادمن باستخدام Spec Kit لا يظهر سوى للمالك عبارة عن بعض الاحصائيات والتقارير - من قام بعمل فواتير فى تاريخ معين وكم عدد تلك الفواتير - هل تم إنشاء حسابات جديدة فى تاريخ معين وكم حساب - المديول قابل للتوسع مستقبلا"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Overview Statistics Dashboard (Priority: P1)

The owner opens the admin page and navigates to the "التقارير" (Reports) tab. They immediately see a set of summary cards showing: total invoices across all users, total accounts, new accounts today, new accounts this week, and new accounts this month. This gives them a quick health check of the system.

**Why this priority**: This is the core value — at-a-glance system health metrics that answer "how is the system doing?" without any interaction required.

**Independent Test**: Navigate to admin > التقارير tab and verify all 5 stat cards display correct counts from the database.

**Acceptance Scenarios**:

1. **Given** the owner is logged in, **When** they click the "التقارير" tab, **Then** they see 5 summary stat cards with real-time counts.
2. **Given** a non-owner admin is logged in, **When** they view the admin page, **Then** the "التقارير" tab is NOT visible.
3. **Given** the database has users with invoices, **When** the overview loads, **Then** "إجمالي الفواتير" shows the sum of all `calculationsCount` across users.

---

### User Story 2 - Date-Based Account Creation Report (Priority: P2)

The owner wants to know how many accounts were created on a specific date. They select a date using a date picker and see a table listing all accounts created that day with their details (username, role, phone, office).

**Why this priority**: Date-based queries are the primary analytical need — tracking growth and account creation patterns.

**Independent Test**: Select any date from the date picker and verify the table shows only accounts created on that exact date.

**Acceptance Scenarios**:

1. **Given** the owner selects a date, **When** the query completes, **Then** a table shows all accounts created on that date with username, role, phone, and office name.
2. **Given** no accounts were created on the selected date, **When** the query completes, **Then** a friendly "لا توجد حسابات" message appears.
3. **Given** the owner selects today's date, **When** the query completes, **Then** they see accounts created today (matching the "new today" stat card count).

---

### User Story 3 - Invoice Leaderboard (Priority: P3)

The owner wants to see which users have generated the most invoices. A ranked table shows all users sorted by `calculationsCount` in descending order, with their role and office details.

**Why this priority**: Useful for identifying power users and understanding usage patterns, but not as critical as overview stats.

**Independent Test**: View the invoice leaderboard table and verify users are sorted by invoice count descending.

**Acceptance Scenarios**:

1. **Given** the reports tab is open, **When** the leaderboard section loads, **Then** users are listed in descending order by invoice count with role badges.
2. **Given** a user has 0 invoices, **When** they appear in the leaderboard, **Then** they show "0 فاتورة" with appropriate styling.

---

### Edge Cases

- What happens when the database is completely empty? → Show zero values in stat cards, empty tables with friendly messages.
- How does the system handle API errors? → Display error toast, allow retry.
- What happens during loading? → Show spinner placeholders for each section independently.
- What if the date picker receives an invalid date? → Show validation message, do not query.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display total invoices (sum of all `calculationsCount`) across all users.
- **FR-002**: System MUST display total account count.
- **FR-003**: System MUST display new accounts created today, this week (last 7 days), and this month.
- **FR-004**: System MUST allow the owner to select a date and view accounts created on that date.
- **FR-005**: System MUST display a ranked leaderboard of users by invoice count.
- **FR-006**: The reports tab MUST only be visible to the owner role.
- **FR-007**: The reports API MUST be protected by `requireOwner` middleware.
- **FR-008**: System MUST handle loading, empty, and error states gracefully.
- **FR-009**: All text MUST be in Arabic with RTL layout.
- **FR-010**: The module MUST be extensible — new report types can be added without modifying existing ones.

### Key Entities

- **User**: Existing model. Used for `createdAt`, `calculationsCount`, `username`, `role`, `phone`, `officeName`, `lastLogin`.
- **Report Query**: Conceptual entity — the API accepts a `type` parameter to determine which aggregation to run.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Owner can view system overview statistics in under 2 seconds of navigating to the tab.
- **SC-002**: Date-based account query returns results in under 1 second.
- **SC-003**: Invoice leaderboard loads and displays all users sorted correctly.
- **SC-004**: Non-owner admins cannot access the reports tab or API (403 response).
- **SC-005**: `npm run build` passes with zero errors after implementation.
- **SC-006**: Module is extensible — adding a new report type requires only adding a new API case and a new sub-component.

## Assumptions

- Existing `calculationsCount` on User model is the only invoice data source (no per-invoice date tracking).
- Date-based queries are limited to account creation dates (`User.createdAt`), not invoice dates.
- The reports module is owner-only, consistent with the existing "بيانات المشروع" tab pattern.
- No new npm dependencies are needed — existing tech stack is sufficient.
- The module will be extended in the future with additional report types (e.g., login activity, revenue reports).
