## Amanat Constitution

<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0 (post-reverse-engineering alignment)
Changes:
  - Principle II: corrected "server-side" parsing to reflect actual client-side parsing architecture
  - Principle III: corrected "cache headers" to reflect actual MemoryCache + IndexedDB strategy
  - Added Principle VI: Role-Based Access Control (4-role model discovered in RE)
  - Added Principle VII: Domain-Specific Calculation Integrity (storage calculator)
  - Added accountCode linking rule to Principle II
  - Added Storage Calculator entry to Technology Stack Constraints
No removed sections.
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed
  - .specify/templates/spec-template.md ✅ no changes needed
  - .specify/templates/tasks-template.md ✅ no changes needed
Follow-up TODOs: None
-->

## Core Principles

### I. Arabic-First User Experience

- The primary language is Arabic; all user-facing text MUST be in Arabic with
  RTL layout as the default.
- Font stack MUST include an Arabic-optimized typeface (e.g., Alexandria).
- Search functionality MUST support Arabic keyboard layout detection and
  transparent English-to-Arabic transliteration.
- Date pickers and number formats MUST follow Arabic conventions where
  applicable.
- Every new UI component MUST be tested in both light and dark themes.

### II. Data Integrity & Security

- All API endpoints that mutate data MUST require JWT authentication.
- Account lockout attempts MUST be enforced atomically to prevent race
  conditions.
- File uploads (trial balance HTML exports) are parsed client-side via
  `parser.js` (windows-1256 encoding). Parsed data MUST be validated
  before persisting to IndexedDB and MongoDB.
- The `accountCode` field on the User model MUST match the `accountCode`
  on AccountData to link clients to their financial records. This
  relationship MUST be enforced at the API level.
- Sensitive configuration (DB URIs, JWT secrets) MUST reside in environment
  variables and NEVER be committed to version control.
- MongoDB operations MUST use Mongoose models with explicit schemas;
  raw collection access is prohibited.

### III. Performance & Offline Resilience

- The application MUST function as a Progressive Web App (PWA) with a
  service worker and web manifest.
- Client-side caching via IndexedDB (Dexie) MUST be used to reduce
  server round-trips for repeated queries.
- Server-side caching via MemoryCache (`lib/cache.js`) with TTL-based
  expiry and pattern invalidation MUST be used for hot data (accounts,
  settings). Client-side caching via IndexedDB (Dexie) MUST be used to
  reduce server round-trips for repeated queries.
- Initial page load MUST remain under 3 seconds on a standard 4G
  connection; bundle splitting and lazy loading are mandatory for
  non-critical routes.
- Microsoft Clarity analytics MUST be loaded asynchronously to avoid
  blocking rendering.

### IV. Code Quality & Testing

- Every new feature MUST include unit tests for business logic and
  integration tests for API endpoints.
- ESLint with the Next.js config MUST pass with zero errors before
  any code is merged.
- React components MUST follow a consistent naming convention:
  PascalCase for components, camelCase for hooks and utilities.
- Custom hooks MUST encapsulate state and side effects; components
  SHOULD remain presentational where possible.
- All changes MUST be reviewed via pull request; self-merge is
  permitted only for non-critical documentation fixes.

### V. Simplicity & Minimal Dependencies

- New dependencies MUST be justified; prefer built-in Next.js and
  React capabilities over third-party libraries.
- When a library is adopted, it MUST be pinned to a specific major
  version and its bundle size impact assessed.
- Dead code and unused dependencies MUST be removed promptly.
- Architecture decisions SHOULD favor composition over inheritance
  and flat module structures over deep nesting.
- YAGNI (You Aren't Gonna Need It): avoid speculative features that
  have no corresponding user story.

### VI. Role-Based Access Control

- The system enforces a 4-role model: **owner**, **admin**, **employee**,
  **client**. Every API endpoint MUST declare its minimum required role.
- **owner**: Full access; accounts with this role MUST NOT be deletable.
- **admin**: Full access to accounts CRUD, data upload, settings, and cache.
- **employee**: Dashboard and storage calculator access only.
- **client**: Own balance view only, scoped by `accountCode` from JWT.
- Role escalation MUST be prevented at both API and UI layers.

### VII. Domain-Specific Calculation Integrity

- The storage calculator MUST use the tiered pricing engine in
  `storageCalculator.js` with config from `storageConstants.js`.
- Grace periods, tier brackets, rate multipliers, and surcharges MUST
  match the published rates page (`/Storagecalculator/rates`).
- All currency conversions MUST use the admin-configured exchange rate
  from Settings, with a documented fallback default.
- VAT (14%) and martyr stamp (5 EGP) MUST always be applied to the
  final EGP total with ceiling rounding.
- Attempts consumption MUST be atomic (`$inc`) to prevent race conditions.

## Technology Stack Constraints

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | Server Components by default; `"use client"` only when needed |
| UI Library | React 19 | No class components |
| Styling | Tailwind CSS 4 | Utility-first; no inline styles unless dynamic |
| State | Zustand | Global stores only; local state via `useState`/`useReducer` |
| Database | MongoDB via Mongoose | Schema-first; connection pooling via `lib/mongodb.js` |
| Auth | JWT (jose + jsonwebtoken) | HTTP-only cookies; bcrypt for password hashing |
| Offline | Dexie (IndexedDB) | Cache API responses; sync when online |
| Analytics | Microsoft Clarity | Async script in `<head>` |
| Fonts | Google Fonts (Alexandria + Outfit) | `display: swap` to prevent FOIT |
| Calculator | storageCalculator.js + storageConstants.js | Tiered pricing engine for container storage fees |

Breaking changes in Next.js MUST be verified against
`node_modules/next/dist/docs/` before writing any code.

## Development Workflow

- **Branching**: Feature branches off `main`; naming convention:
  `feature/<short-description>` or `fix/<short-description>`.
- **Commits**: Conventional Commits format
  (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **Code Review**: All PRs require at least one review before merge
  (exception: solo-developer documentation updates).
- **CI Gate**: Lint + build MUST pass before merge is allowed.
- **Spec-Driven**: All non-trivial features MUST go through the
  Spec Kit workflow: specify → plan → tasks → implement.

## Governance

- This constitution supersedes all ad-hoc coding practices and MUST be
  consulted before architectural decisions.
- Amendments require:
  1. A written proposal documenting the change and rationale.
  2. Update to this file with a version bump (semantic versioning).
  3. Propagation of changes to all dependent Spec Kit templates.
- Compliance is verified during code review; reviewers MUST flag
  violations before approving a PR.
- Complexity that deviates from these principles MUST be explicitly
  justified in the PR description.

**Version**: 1.1.0 | **Ratified**: 2026-06-16 | **Last Amended**: 2026-06-16
