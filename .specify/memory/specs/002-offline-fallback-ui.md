# Feature Specification: Offline Fallback UI

**Feature Branch**: `002-offline-fallback-ui`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "Service Worker without fallback UI — when network fails on navigation, `sw.js` does `.catch(() => cache.match('/'))`. If there's no cache, the user sees a white screen. Need a proper offline page."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Offline Page Instead of White Screen (Priority: P1)

When a user navigates to any page while offline and there is no cached version available, they should see a friendly Arabic offline page instead of a white screen or browser error.

**Why this priority**: The white screen is a critical UX failure — the user has no idea what happened and no guidance on what to do next. This is the core problem being solved.

**Independent Test**: Can be fully tested by disabling network in DevTools and navigating to a page that has never been cached. Delivers a branded offline page with clear messaging.

**Acceptance Scenarios**:

1. **Given** the user is offline and no cache exists, **When** they navigate to `/employees`, **Then** they see the offline fallback page (not a white screen or browser error).
2. **Given** the user is offline and `/` is cached, **When** they navigate to `/`, **Then** they see the cached version (existing behavior preserved).
3. **Given** the user is online, **When** they navigate to any page, **Then** they see the normal page (existing behavior preserved).

---

### User Story 2 - Retry Button (Priority: P1)

The offline page should have a "retry" button so the user can try loading the page again when connectivity is restored.

**Why this priority**: Without a retry mechanism, the user has to manually refresh or navigate again, which is confusing. A single button makes recovery trivial.

**Independent Test**: Can be tested by going offline → seeing offline page → re-enabling network → clicking retry → seeing the original page load.

**Acceptance Scenarios**:

1. **Given** the user is on the offline page, **When** they click "إعادة المحاولة" (Retry), **Then** the browser reloads the original URL they were trying to access.
2. **Given** the user is on the offline page and still offline, **When** they click retry, **Then** they see the offline page again.

---

### User Story 3 - Theme-Aware Offline Page (Priority: P2)

The offline page should respect the user's dark/light theme preference so it doesn't flash a wrong theme.

**Why this priority**: Consistency with the rest of the app. A sudden white page in dark mode (or vice versa) would be jarring.

**Independent Test**: Can be tested by setting the OS/browser to dark mode, going offline, and confirming the offline page renders in dark theme.

**Acceptance Scenarios**:

1. **Given** the user has dark theme selected, **When** they see the offline page, **Then** the page is styled in dark mode.
2. **Given** the user has light theme selected, **When** they see the offline page, **Then** the page is styled in light mode.
3. **Given** the user has no theme preference, **When** they see the offline page, **Then** it follows the OS `prefers-color-scheme`.

---

### User Story 4 - Pre-cache Offline Page on SW Install (Priority: P1)

The offline page must be pre-cached during service worker installation so it's always available even on the very first offline visit.

**Why this priority**: Without pre-caching, the offline page itself could fail to load on first offline visit. This is foundational.

**Independent Test**: Can be tested by installing the SW fresh (clear all caches), going offline, and confirming the offline page still shows.

**Acceptance Scenarios**:

1. **Given** a fresh SW install with no prior navigation cache, **When** the user goes offline and navigates, **Then** the offline page is available from cache.
2. **Given** SW updates to a new version, **When** the new SW activates, **Then** the offline page is re-cached with the new version.

---

### Edge Cases

- What happens when the user is offline and tries to access an API route? — API routes are already excluded from SW caching (`request.url.includes('/api/')`), so the browser returns its own network error. Out of scope for this feature.
- What happens when the offline page itself fails to load from cache (corrupted cache)? — Fall back to a minimal inline HTML response generated in the SW (last resort, no white screen).
- How does the system handle the offline page being stale? — It's re-cached on every SW version update (same `CACHE_NAME` lifecycle as all other assets).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a branded offline fallback page when navigation fails and no cached version exists.
- **FR-002**: The offline page MUST be entirely in Arabic with RTL layout.
- **FR-003**: The offline page MUST include a "retry" button that reloads the original URL.
- **FR-004**: The offline page MUST support both dark and light themes via `data-theme` attribute + `prefers-color-scheme` media query.
- **FR-005**: The service worker MUST pre-cache the offline page during the `install` event.
- **FR-006**: The service worker navigation fallback chain MUST be: cached page → offline page → minimal inline response.
- **FR-007**: The offline page MUST be a static HTML file (no dependency on React, Next.js, or network).
- **FR-008**: The offline page MUST include the Amanat branding (app name, icon).
- **FR-009**: The offline page file size MUST be under 10 KB (self-contained, no external resources).

### Key Entities

- **Offline Fallback Page** (`public/offline.html`): A standalone static HTML page with inline CSS, Arabic RTL content, theme support, and a retry button. No external dependencies.
- **Service Worker** (`public/sw.js`): Updated to pre-cache the offline page and use it as the navigation fallback.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User never sees a white screen or browser error when navigating offline — they always see the branded offline page.
- **SC-002**: Offline page loads in under 100ms (served from SW cache, no network).
- **SC-003**: Offline page file size is under 10 KB.
- **SC-004**: Offline page renders correctly in both dark and light themes on mobile and desktop.

## Assumptions

- The offline page will be a **static HTML file** in `public/` — it cannot use React, Next.js SSR, or any network-dependent resources.
- CSS will be **inline** within the HTML file (no external stylesheet) to guarantee zero dependencies.
- The Amanat app icon (`/icons/tader192.png`) may or may not be cached; the offline page should use a **CSS-only icon** as a safe fallback.
- The existing theme detection script from `layout.js` (`localStorage.getItem('theme')` → `data-theme`) will be reused inline.
- The offline page does NOT need to show dynamic data (e.g., "you were on page X") — it's a generic offline message.
