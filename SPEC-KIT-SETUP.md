# Spec Kit — Complete Guide for the Amanat Project

This is a full roadmap for any developer who wants to use **Spec Kit** to build features in the Amanat project using **Spec-Driven Development (SDD)**. It documents every step we took, the commands used, the files created, and the reasoning behind each decision.

---

## What is Spec Kit?

[Spec Kit](https://github.com/github/spec-kit) is an open-source toolkit from GitHub that enables **Spec-Driven Development (SDD)** — a methodology where you write specifications first, then the AI coding agent implements them in a structured, predictable way.

Instead of "vibe coding", you follow a clear workflow:

```
Constitution → Reverse Engineering → Specify → Plan → Tasks → Implement
```

---

## Part 1: Installation & Setup

### Prerequisites

| Tool | Required | Purpose |
|------|----------|---------|
| Git | Yes | Version control |
| uv | Yes | Python package manager — installs Spec Kit CLI and bundles Python |
| Python 3.11+ | Yes | Runtime for Spec Kit (auto-downloaded by uv) |

### Step 1: Install uv

`uv` is the recommended package manager for Spec Kit. It handles Python installation automatically.

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Add to PATH (required in **each new terminal session**):

```powershell
$env:Path = "C:\Users\Administrator\.local\bin;$env:Path"
```

> **Tip:** To make this permanent, add `C:\Users\Administrator\.local\bin` to your system PATH environment variable.

Verify:

```powershell
uv --version
```

### Step 2: Install Spec Kit CLI

```powershell
uv tool install specify-cli --from "git+https://github.com/github/spec-kit.git@v0.10.3"
```

> Replace `v0.10.3` with the latest tag from: https://github.com/github/spec-kit/releases/latest

Verify:

```powershell
specify --version
```

### Step 3: Initialize Spec Kit in the Project

```powershell
specify init . --force --integration copilot --ignore-agent-tools --script ps
```

| Flag | Purpose |
|------|---------|
| `.` | Initialize in the current directory |
| `--force` | Skip confirmation prompt (needed for non-empty directories) |
| `--integration copilot` | Use GitHub Copilot slash-command format (compatible with most AI agents) |
| `--ignore-agent-tools` | Skip CLI tool detection (since we're using an IDE-based agent) |
| `--script ps` | Use PowerShell scripts instead of Bash |

### Directory Structure Created

```
.specify/
├── extensions/          # Bundled extensions
├── integrations/        # Agent integration config
├── memory/              # Project knowledge (constitution, specs, reports)
│   ├── constitution.md
│   ├── reverse-engineering-report.md
│   └── specs/           # Feature specifications and plans
├── scripts/             # PowerShell helper scripts
├── templates/           # Spec, plan, tasks, checklist templates
├── workflows/           # SDD workflow definitions
├── extensions.yml
├── init-options.json
└── integration.json
```

---

## Part 2: The SDD Workflow (Step by Step)

Once installed, you follow these steps for every new feature. Below is the exact process we used, with explanations of **what**, **why**, and **what was produced**.

### Step A: Create the Constitution

**What:** The constitution is a set of governing principles that every code change must follow. It defines the project's non-negotiable rules.

**Why:** Without a constitution, the AI agent might make inconsistent architectural decisions. The constitution acts as a "code of law" that gates every plan.

**How:** Fill in `.specify/memory/constitution.md` with principles tailored to your project.

**What we created** (v1.1.0 — 7 principles):

| # | Principle | Summary |
|---|-----------|---------|
| I | Arabic-First UX | RTL default, Arabic fonts, keyboard transliteration, dark/light themes |
| II | Data Integrity & Security | JWT auth, atomic operations, client-side parsing, accountCode linking |
| III | Performance & Offline Resilience | PWA, MemoryCache + IndexedDB, <3s load |
| IV | Code Quality & Testing | Unit + integration tests, ESLint zero errors, PascalCase components |
| V | Simplicity & Minimal Dependencies | Justify new deps, pin versions, YAGNI |
| VI | Role-Based Access Control | 4-role model: owner, admin, employee, client |
| VII | Domain-Specific Calculation Integrity | Tiered pricing engine, VAT, exchange rates |

**File:** `.specify/memory/constitution.md`

**Key lesson:** We initially wrote the constitution before fully understanding the project. After reverse engineering (Step B), we updated it to v1.1.0 to align with the actual architecture. **Always reverse-engineer first, then write the constitution.**

---

### Step B: Reverse Engineering (Understand the Project)

**What:** Read and analyze every source file in the project to build a complete mental model before writing any specs.

**Why:** You cannot write good specifications if you don't understand the existing architecture. This step prevents specs that conflict with current patterns.

**How:** Systematically read all files in this order:
1. API routes (endpoints, auth, data flow)
2. Models (MongoDB schemas, indexes)
3. Hooks (state management, side effects)
4. Components (UI patterns, props)
5. Libraries (utilities, configs, constants)
6. Pages (routing, server vs client components)
7. Stores (Zustand, persistence)

**What we created:** A comprehensive report documenting:
- Architecture diagram
- API endpoints map with auth requirements
- Data models and relationships
- Caching strategy (server MemoryCache + client IndexedDB)
- Authentication flow and role-based access
- Storage calculator pricing engine
- Arabic-first features inventory

**File:** `.specify/memory/reverse-engineering-report.md` (405 lines)

**Key lesson:** This step is NOT optional. Skipping it led to a constitution that didn't match reality. The report becomes a reference for every future spec.

---

### Step C: Specify (Define What to Build)

**What:** Write a feature specification focused on the **what** and **why** — not the technical implementation.

**Why:** Specs separate user needs from technical decisions. This prevents premature optimization and ensures the feature actually solves a user problem.

**How:** Use the spec template at `.specify/templates/spec-template.md` to create a new spec file.

**Template structure:**
- **User Stories** (prioritized: P1, P2, P3) with acceptance scenarios (Given/When/Then)
- **Edge Cases** (boundary conditions, error scenarios)
- **Functional Requirements** (FR-001, FR-002, ...)
- **Key Entities** (data model concepts, not implementation)
- **Success Criteria** (measurable outcomes)
- **Assumptions** (explicit decisions about unclear areas)

**What we created** (example: Employee Availability feature):
- 6 user stories: View employees (P1), Phone call (P1), WhatsApp (P1), Admin CRUD (P2), Toggle availability (P2), Navigation (P3)
- 12 functional requirements
- 6 measurable success criteria

**File:** `.specify/memory/specs/001-employee-availability.md`

**Key lesson:** Each user story should be **independently testable** — meaning if you implement just one story, you still have a usable MVP.

---

### Step D: Plan (Technical Implementation Design)

**What:** Create a detailed technical plan that maps the spec to your actual codebase.

**Why:** The plan bridges the gap between "what the user wants" and "which files to create/modify". It identifies the exact architecture decisions before coding begins.

**How:** Use the plan template at `.specify/templates/plan-template.md`.

**Template structure:**
- **Summary** (one paragraph)
- **Technical Context** (language, dependencies, storage, platform)
- **Constitution Check** (verify all principles pass — this is a GATE)
- **Project Structure** (new files to create, existing files to modify)
- **Detailed Design** (data models, API endpoints, component architecture, data flow)
- **Complexity Tracking** (justify any constitution violations)

**What we created** (example: Employee Availability):
- New files: Mongoose model, 2 API routes, server page, client component, EmployeeCard
- Modified files: admin page (new tab), AdminNav (new link)
- API design: GET (auth), POST (admin), PUT (admin), DELETE (admin)
- Data flow diagram
- Constitution check: all 7 principles passed

**File:** `.specify/memory/specs/001-employee-availability-plan.md`

**Key lesson:** The Constitution Check is critical. If any principle fails, you must either fix the plan or explicitly justify the violation in the Complexity Tracking section.

---

### Step E: Tasks (Break Down into Ordered Steps)

**What:** Decompose the plan into small, verifiable implementation tasks grouped by user story.

**Why:** Large features are overwhelming. Tasks make implementation predictable and allow you to stop at any checkpoint to validate.

**How:** Use the tasks template at `.specify/templates/tasks-template.md`.

**Template structure:**
- **Phase 1: Foundation** — model + API (blocks everything)
- **Phase 2: User Story 1 (P1)** — MVP deliverable
- **Phase 3: User Story 2 (P2)** — adds admin control
- **Phase N: Polish** — theme, responsive, build, lint
- **Dependencies & Execution Order** diagram
- **Implementation Strategy** (MVP first vs full delivery)

**What we created** (example: Employee Availability):
- 21 tasks across 5 phases
- Phase 1: Foundation (4 tasks) — Model + API
- Phase 2: Customer Page (4 tasks) — Cards + call + WhatsApp
- Phase 3: Admin CRUD (6 tasks) — Tab + table + modals
- Phase 4: Navigation (2 tasks) — Nav link
- Phase 5: Polish (5 tasks) — Theme + responsive + build

**File:** `.specify/memory/specs/001-employee-availability-tasks.md`

**Key lesson:** Tasks are ordered so that you can deliver an MVP after Phase 2, even if later phases aren't done yet. Each phase adds value independently.

---

### Step F: Implement (Build the Feature)

**What:** Execute the tasks one by one, following the plan.

**Why:** With a good spec, plan, and task list, implementation becomes straightforward — most decisions are already made.

**How:** Work through each task sequentially:
1. Start with Foundation (model + API)
2. Build MVP story (customer-facing)
3. Add admin management
4. Integrate navigation
5. Polish (theme, responsive, build check)

**Verification after each phase:**
- Foundation: Test API endpoints manually
- MVP: Load customer page, verify cards and buttons
- Admin: Full CRUD cycle, verify customer page updates
- Navigation: Check link for all roles
- Polish: `npm run build` (zero errors) + `npm run lint`

**What we created** (example: Employee Availability):
- 5 new files, 2 modified files
- Build passes clean
- All routes compile correctly

**Key lesson:** Run `npm run build` after each major change to catch import errors early. We caught a MongoDB import mismatch this way.

---

## Part 3: SDD Command Reference

### Core Commands (in order)

| # | Command | Purpose | When to Use |
|---|---------|---------|-------------|
| 1 | `/speckit.constitution` | Establish project principles | Once at project start |
| 2 | `/speckit.specify` | Define what to build | For each new feature |
| 3 | `/speckit.plan` | Technical implementation plan | After spec is approved |
| 4 | `/speckit.tasks` | Break down into ordered tasks | After plan is approved |
| 5 | `/speckit.implement` | Execute all tasks | After tasks are approved |

### Optional Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/speckit.clarify` | Structured Q&A for ambiguous areas | Before `/speckit.plan` |
| `/speckit.analyze` | Cross-artifact consistency report | After `/speckit.tasks` |
| `/speckit.checklist` | Quality checklists for validation | After `/speckit.plan` |

---

## Part 4: Artifacts Created

After completing the full SDD cycle, these files exist in the project:

```
.specify/memory/
├── constitution.md                              # Project principles (v1.1.0)
├── reverse-engineering-report.md                # Full project analysis
└── specs/
    └── 001-employee-availability/
        ├── 001-employee-availability.md         # Feature spec
        ├── 001-employee-availability-plan.md    # Technical plan
        └── 001-employee-availability-tasks.md   # Task breakdown
```

Each new feature gets its own numbered directory under `specs/`.

---

## Part 5: Maintenance Commands

```powershell
# Add uv to PATH (each new terminal session)
$env:Path = "C:\Users\Administrator\.local\bin;$env:Path"

# Check for newer Spec Kit releases
specify self check

# Upgrade to latest version
specify self upgrade

# Upgrade to a specific version
specify self upgrade --tag vX.Y.Z

# Browse community extensions
specify extension search

# Install an extension
specify extension add <extension-name>
```

---

## Part 6: Troubleshooting

| Issue | Solution |
|-------|----------|
| `uv` not recognized | Add to PATH: `$env:Path = "C:\Users\Administrator\.local\bin;$env:Path"` |
| `specify` not recognized | Same as above — `specify` is installed in the uv bin directory |
| "Not a spec-kit project" | Run `specify init . --force` in the project root |
| Non-empty directory error | Add `--force` flag to `specify init` |
| Build errors after implementation | Run `npm run build` — check for import/export mismatches (e.g., `connectDB` vs `connectToDatabase`) |
| Lint errors | Most `react-hooks/set-state-in-effect` warnings are pre-existing in this project — only fix new ones |

---

## Part 7: Tips & Lessons Learned

1. **Reverse-engineer first.** Never write a constitution or spec without fully understanding the existing codebase. We had to update our constitution from v1.0.0 to v1.1.0 after reverse engineering.

2. **Each story must be independently testable.** If you can only deliver everything at once, your stories are too coupled. Think of each story as a standalone slice.

3. **The Constitution Check is a real gate.** Before writing any plan, verify every principle passes. If one fails, either fix the plan or justify the violation.

4. **Run build after each phase.** Don't wait until the end. We caught a MongoDB named export vs default export mismatch immediately by building early.

5. **Follow existing patterns.** When adding to an existing codebase, match the patterns already in use (same component structure, same API response format, same naming conventions).

6. **Phone masking matters.** For the employee feature, we masked phone numbers on display but used full numbers in `tel:` and `wa.me` action links. This prevents scraping while keeping functionality.

7. **Arabic-first means testing in RTL.** Every new component must be verified in RTL layout with Arabic text. Use `dir="rtl"` and test both dark and light themes.

---

## References

- GitHub Repo: https://github.com/github/spec-kit
- Releases: https://github.com/github/spec-kit/releases
- Docs: https://github.github.io/spec-kit/
- Spec Kit version: **v0.10.3** (installed June 16, 2026)
