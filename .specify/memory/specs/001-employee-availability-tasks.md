# Tasks: Employee Availability (توفر الموظفين)

**Spec**: [001-employee-availability.md](./001-employee-availability.md)
**Plan**: [001-employee-availability-plan.md](./001-employee-availability-plan.md)

## Phase 1: Foundational (Model + API)

**Purpose**: Core infrastructure that all user stories depend on.

- [ ] T001 Create `EmployeeAvailability` Mongoose model in `src/models/EmployeeAvailability.js`
  - Fields: name (String, required), phone (String, required), role (String, required), isActive (Boolean, default: true), sortOrder (Number, default: 0), timestamps
  - Indexes: `{ isActive: 1, sortOrder: 1 }`, `{ sortOrder: 1 }`

- [ ] T002 Create API route `src/app/api/employees/route.js`
  - GET: `requireAuth` — if admin/owner: return ALL sorted by sortOrder; if other roles: return only `{ isActive: true }` sorted by sortOrder
  - POST: `requireAdmin` — create employee, validate phone `/^01[0-9]{9}$/`, return created employee

- [ ] T003 Create API route `src/app/api/employees/[id]/route.js`
  - PUT: `requireAdmin` — partial update (name, phone, role, isActive, sortOrder)
  - DELETE: `requireAdmin` — delete by ID

- [ ] T004 Verify API manually: GET returns empty array, POST creates, PUT updates, DELETE removes

**Checkpoint**: Foundation ready — API is fully functional

---

## Phase 2: Customer Page (US1 + US2 + US3) — Priority P1 🎯 MVP

**Goal**: Customer sees available employees and can contact them via phone call or WhatsApp with one click.

**Independent Test**: Login as any role → navigate to `/employees` → see employee cards → tap call/WhatsApp buttons

### Implementation

- [ ] T005 Create `EmployeeCard` component in `src/components/EmployeeCard.jsx`
  - Props: employee object `{ name, phone, role, isActive }`
  - Display: name, role badge, masked phone (`****-***-XXXX`), green availability dot
  - Call button: `<a href="tel:{phone}">` with phone icon
  - WhatsApp button: `<a href="https://wa.me/2{phone_without_0}?text={encoded_greeting}">` with WhatsApp icon
  - Desktop fallback: copy phone number to clipboard on call button click
  - RTL Arabic layout, dark/light theme support
  - Large touch targets for mobile

- [ ] T006 Create customer page `src/app/employees/page.jsx`
  - Server component: fetch active employees from MongoDB directly (`EmployeeAvailability.find({ isActive: true }).sort({ sortOrder: 1 })`)
  - Auth guard: redirect to `/login` if not authenticated (check JWT cookie)
  - Pass employees data to client component
  - Client component: render grid of `EmployeeCard` components
  - Empty state: Arabic message "لا يوجد موظفين متاحين حالياً، يرجى المحاولة لاحقاً"
  - Mobile-first responsive: 1 col mobile, 2 cols tablet, 3 cols desktop
  - RTL layout, dark/light theme, consistent with existing pages

- [ ] T007 Add needed icons to `src/components/Icons.jsx` (if not already present)
  - Verify: `WhatsAppIcon`, `PhoneIcon` exist ✅
  - Add: `CopyIcon` (for clipboard fallback), `MessageCircleIcon` or reuse WhatsApp

- [ ] T008 Manual test: customer page loads, cards display, call/WhatsApp buttons work

**Checkpoint**: Customer-facing page fully functional — MVP deliverable

---

## Phase 3: Admin Management (US4 + US5) — Priority P2

**Goal**: Admin can add, edit, delete employees and toggle their availability from the admin panel.

**Independent Test**: Login as admin → go to `/admin` → "الموظفين" tab → CRUD operations → verify customer page updates

### Implementation

- [ ] T009 Add "الموظفين" tab to admin panel in `src/app/admin/page.jsx`
  - Add tab button: `{ id: "employees", icon: <Icon.Users />, label: "الموظفين" }`
  - Add tab content section with employee table

- [ ] T010 Implement employee admin table in `src/app/admin/page.jsx`
  - Columns: Name, Phone, Role, Status badge (active/inactive), Sort Order, Actions
  - Fetch employees on tab mount: `GET /api/employees`
  - Status badge: green for active, red for inactive
  - Inline toggle: click status badge to toggle `isActive` via `PUT /api/employees/[id]`

- [ ] T011 Implement employee form modal in `src/app/admin/page.jsx`
  - Add/Edit form with fields: name (text), phone (text, validated), role (text), isActive (toggle), sortOrder (number)
  - Phone validation: Egyptian format `/^01[0-9]{9}$/`
  - Reuse existing `Modal`, `Field`, `Input`, `Btn` components from admin page
  - Add modal: "إضافة موظف جديد"
  - Edit modal: "تعديل بيانات الموظف"

- [ ] T012 Implement delete confirmation modal in `src/app/admin/page.jsx`
  - Reuse existing delete confirmation pattern (type name to confirm)
  - Call `DELETE /api/employees/[id]`
  - Show toast on success/error

- [ ] T013 Implement CRUD functions in `src/app/admin/page.jsx`
  - `addEmployee(form)` → POST `/api/employees`
  - `editEmployee(form)` → PUT `/api/employees/[id]`
  - `deleteEmployee()` → DELETE `/api/employees/[id]`
  - `toggleEmployeeActive(id, isActive)` → PUT `/api/employees/[id]` with `{ isActive }`
  - Toast notifications for all operations

- [ ] T014 Manual test: full CRUD cycle, toggle works, customer page reflects changes

**Checkpoint**: Admin can manage employee list — US4 + US5 complete

---

## Phase 4: Navigation Integration (US6) — Priority P3

**Goal**: Employee availability page accessible from main navigation for all authenticated users.

**Independent Test**: Check nav menu for link → click → lands on `/employees` page

### Implementation

- [ ] T015 Add `/employees` to `NAV_ITEMS` in `src/components/AdminNav.jsx`
  - Entry: `{ href: '/employees', label: 'الموظفين المتاحين', icon: UsersIcon, exactMatch: true, roles: ['owner', 'admin', 'employee', 'client'] }`
  - Position: after `/client/balance`, before `/Storagecalculator/rates`

- [ ] T016 Manual test: nav link visible for all roles, click navigates correctly, active state works

**Checkpoint**: Navigation complete — all user stories functional

---

## Phase 5: Polish & Cross-Cutting

- [ ] T017 Verify dark/light theme on all new components (EmployeeCard, admin tab, empty states)
- [ ] T018 Verify mobile responsiveness (touch targets, layout, text sizing)
- [ ] T019 Verify RTL layout correctness on all new UI elements
- [ ] T020 Run `npm run build` — ensure zero build errors
- [ ] T021 Run `npm run lint` — ensure zero lint errors

---

## Dependencies & Execution Order

```
Phase 1 (T001-T004) → Phase 2 (T005-T008) → Phase 3 (T009-T014) → Phase 4 (T015-T016) → Phase 5 (T017-T021)
     Foundation          Customer Page MVP       Admin CRUD             Navigation            Polish
```

- Phase 1 blocks everything (model + API must exist first)
- Phase 2 delivers MVP (customer page works independently)
- Phase 3 adds admin control (depends on Phase 1 API)
- Phase 4 adds nav link (depends on Phase 2 page existing)
- Phase 5 is cross-cutting polish

## Implementation Strategy

### MVP First (Phases 1-2 only)

1. Complete Phase 1: Model + API
2. Complete Phase 2: Customer page with cards
3. **STOP and VALIDATE**: Customer can view and contact employees
4. Deploy if ready

### Full Delivery (All Phases)

1. Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
2. Each phase adds value without breaking previous work
3. Final build + lint check before completion
