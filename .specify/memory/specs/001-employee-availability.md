# Feature Specification: Employee Availability (توفر الموظفين)

**Feature Branch**: `001-employee-availability`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "Create a new customer-facing UI that shows Amanat employees available today. Customers can see who's available and contact them via one-click phone call or WhatsApp message. Admin can manage which employees appear (add, edit, delete) from the admin panel."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer Views Available Employees (Priority: P1)

As a **customer** logged into the Amanat system, I want to see a list of employees who are on duty today so that I know who I can reach out to for help.

**Why this priority**: This is the core value proposition — without knowing who's available, the customer cannot initiate contact. This is the foundation all other features depend on.

**Independent Test**: Can be fully tested by logging in as a customer, navigating to the employee availability page, and verifying that only employees marked as available today are displayed with their name, role/title, and status indicator.

**Acceptance Scenarios**:

1. **Given** a customer is logged in, **When** they navigate to the employee availability page, **Then** they see a list of employees marked as available today, each showing name, role, and availability status.
2. **Given** no employees are marked as available today, **When** a customer views the page, **Then** they see a friendly message indicating no employees are currently available, with a suggestion to try again tomorrow.
3. **Given** employees are available, **When** a customer views the page on mobile, **Then** the layout is responsive and optimized for touch interaction (large tap targets).

---

### User Story 2 - Customer Contacts Employee via Phone (Priority: P1)

As a **customer**, I want to tap a button next to an employee's name to instantly call their phone number, so I can get immediate help without manually copying numbers.

**Why this priority**: Direct phone contact is the primary communication channel in Egyptian business culture. One-click calling removes friction and is the fastest way to resolve issues.

**Independent Test**: Can be tested by tapping the phone button on any employee card and verifying the device's phone dialer opens with the correct number pre-filled.

**Acceptance Scenarios**:

1. **Given** an employee card is displayed, **When** the customer taps the phone/call button, **Then** the device dialer opens with the employee's phone number (`tel:` link).
2. **Given** the customer is on a desktop browser, **When** they click the phone button, **Then** the phone number is displayed in a copyable format (since `tel:` links don't work on desktop).

---

### User Story 3 - Customer Contacts Employee via WhatsApp (Priority: P1)

As a **customer**, I want to send a WhatsApp message to an available employee with one tap, so I can reach them through the most common messaging platform in Egypt.

**Why this priority**: WhatsApp is the dominant messaging platform in Egypt. One-click WhatsApp messaging is the second most important contact method and provides an asynchronous communication channel.

**Independent Test**: Can be tested by tapping the WhatsApp button on any employee card and verifying WhatsApp opens with the correct number and a pre-filled greeting message.

**Acceptance Scenarios**:

1. **Given** an employee card is displayed, **When** the customer taps the WhatsApp button, **Then** WhatsApp opens (app or web) with the employee's number and a pre-filled Arabic greeting message (e.g., "السلام عليكم، أنا عميل لدى أمانات وأحتاج مساعدة").
2. **Given** the customer does not have WhatsApp installed, **When** they tap the button, **Then** WhatsApp Web opens in the browser as a fallback.

---

### User Story 4 - Admin Manages Employee List (Priority: P2)

As an **admin**, I want to add, edit, and delete employees from the availability list through the admin panel, so I can control which employees are visible to customers.

**Why this priority**: Admin control is essential for maintaining accurate data but is secondary to the customer-facing experience. Without admin management, the feature cannot function long-term.

**Independent Test**: Can be tested by logging into the admin panel, navigating to the employee management section, and performing full CRUD operations (add a new employee, edit their name/phone, toggle their availability, delete them).

**Acceptance Scenarios**:

1. **Given** an admin is on the admin panel, **When** they click "Add Employee", **Then** a form appears with fields for name, phone number, role/title, and availability toggle.
2. **Given** an employee exists in the list, **When** the admin edits their details and saves, **Then** the changes are reflected immediately on the customer-facing page.
3. **Given** an employee exists in the list, **When** the admin deletes them, **Then** they are removed from the customer-facing page with a confirmation prompt.
4. **Given** an employee is toggled as "not available", **When** the admin saves, **Then** the employee does not appear on the customer page but remains in the admin list.

---

### User Story 5 - Admin Toggles Daily Availability (Priority: P2)

As an **admin**, I want to quickly toggle which employees are on duty today, so the customer page always shows accurate real-time availability.

**Why this priority**: Daily toggling is a frequent admin workflow. Making it quick (toggle switch or checkbox) reduces admin overhead and ensures customers always see current data.

**Independent Test**: Can be tested by toggling an employee's availability in the admin panel and verifying the customer page reflects the change within seconds.

**Acceptance Scenarios**:

1. **Given** an admin is viewing the employee list, **When** they toggle an employee's availability switch, **Then** the employee's status changes immediately (available/unavailable) and the customer page updates accordingly.
2. **Given** the admin toggles availability off for all employees, **When** a customer checks the page, **Then** the "no employees available" message is shown.

---

### User Story 6 - Employee Availability Page Accessible from Navigation (Priority: P3)

As a **customer or employee**, I want to access the employee availability page from the main navigation, so I can find it easily without searching.

**Why this priority**: Navigation integration is important for discoverability but not critical to core functionality. The page can be accessed via direct URL during initial testing.

**Independent Test**: Can be tested by checking the navigation menu for a link to the employee availability page and verifying it works for all authenticated roles.

**Acceptance Scenarios**:

1. **Given** a logged-in user (any role), **When** they view the navigation menu, **Then** a link to "الموظفين المتاحين" (Available Employees) is visible.
2. **Given** a user is not logged in, **When** they try to access the page URL directly, **Then** they are redirected to the login page.

---

### Edge Cases

- What happens when an employee's phone number is invalid or missing? → Admin form MUST validate phone format; customer UI hides contact buttons if number is missing.
- What happens when multiple admins edit the employee list simultaneously? → Last write wins; no conflict resolution needed for v1.
- How does the system handle timezone differences for "today"? → Use server-side date (Egypt timezone, UTC+2) to determine current day.
- What if WhatsApp link fails to open? → Fallback: display the phone number with a "copy to clipboard" button.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a customer-facing page (`/employees`) listing all employees marked as available for the current day.
- **FR-002**: Each employee card MUST display: name, role/title, phone number (partially masked for privacy on customer view), and availability indicator (green dot/badge).
- **FR-003**: Each employee card MUST have a phone call button (using `tel:` protocol) and a WhatsApp button (using `https://wa.me/` protocol with pre-filled Arabic greeting).
- **FR-004**: System MUST provide an admin panel section for managing the employee availability list with full CRUD (Create, Read, Update, Delete).
- **FR-005**: Admin form MUST include fields: name (Arabic), phone number (validated Egyptian format), role/title, and availability toggle (active/inactive).
- **FR-006**: System MUST persist the employee availability list in MongoDB as a new collection.
- **FR-007**: Customer page MUST be responsive (mobile-first) and support RTL Arabic layout consistent with the rest of the app.
- **FR-008**: Customer page MUST support both dark and light themes.
- **FR-009**: System MUST require authentication to access the employee availability page (all logged-in roles can view).
- **FR-010**: Only admin/owner roles MUST be able to manage (CRUD) the employee list.
- **FR-011**: WhatsApp pre-filled message MUST be in Arabic: "السلام عليكم، أنا عميل لدى أمانات وأحتاج مساعدة".
- **FR-012**: Phone numbers on customer view MUST be partially masked (e.g., show last 4 digits only) to prevent scraping, while full number is used for call/WhatsApp actions.

### Key Entities

- **EmployeeAvailability**: Represents an employee entry in the availability list.
  - `name` (String, required): Employee display name in Arabic
  - `phone` (String, required): Phone number (Egyptian format, e.g., 01XXXXXXXXX)
  - `role` (String, required): Job title or department (e.g., "خدمة عملاء", "محاسب")
  - `isActive` (Boolean, default: true): Whether this employee appears on the customer page
  - `sortOrder` (Number, optional): Display order on the customer page
  - `createdAt` / `updatedAt` (Date, automatic): Timestamps

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customer can view the available employees list and initiate contact (call or WhatsApp) in under 10 seconds from page load.
- **SC-002**: Admin can add a new employee to the availability list in under 30 seconds.
- **SC-003**: Phone call button opens device dialer with correct number on 100% of mobile interactions.
- **SC-004**: WhatsApp button opens WhatsApp with correct number and pre-filled message on 100% of interactions.
- **SC-005**: Employee availability changes made by admin are reflected on the customer page within 5 seconds (next page load or refresh).
- **SC-006**: Page loads in under 2 seconds on standard 4G connection.

## Assumptions

- Employees in this context are staff members whose contact info is shared with customers — NOT the same as the User model (which handles system authentication). This is a separate, simpler entity.
- Phone numbers follow Egyptian format (01XXXXXXXXX, 11 digits starting with 01).
- WhatsApp is accessible in Egypt and customers have WhatsApp installed or can use WhatsApp Web.
- The feature does NOT require real-time presence detection (e.g., "online now") — availability is manually toggled by admin per day.
- The existing admin panel (`/admin`) will be extended with a new tab or section for employee availability management.
- The customer page will be a new route (`/employees`) accessible to all authenticated users.
- No notification system is needed for v1 (admin manually toggles availability).
