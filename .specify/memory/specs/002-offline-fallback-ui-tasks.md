# Tasks: Offline Fallback UI

**Branch**: `002-offline-fallback-ui` | **Spec**: `002-offline-fallback-ui.md` | **Plan**: `002-offline-fallback-ui-plan.md`

## Phase 1: Foundation — Offline Page

- [ ] **Task 1.1**: Create `public/offline.html` — static HTML with inline CSS (dark/light theme variables matching `globals.css`), inline JS (theme detection from localStorage), Arabic RTL layout, WiFi-off SVG icon, "لا يوجد اتصال بالإنترنت" message, retry button, and أمانات branding.
- [ ] **Task 1.2**: Verify `public/offline.html` file size is under 10 KB.

## Phase 2: Service Worker Integration

- [ ] **Task 2.1**: Update `public/sw.js` `install` event to pre-cache `/offline.html` via `cache.addAll(['/offline.html'])`.
- [ ] **Task 2.2**: Update `public/sw.js` navigation fallback chain (lines 97-114): after `cache.match('/')` fails, try `cache.match('/offline.html')`, then fall back to an inline minimal HTML response as a last resort.
- [ ] **Task 2.3**: Bump `CACHE_NAME` version in `sw.js` to invalidate old caches.

## Phase 3: Verification

- [ ] **Task 3.1**: Run `npm run build` — verify zero errors.
- [ ] **Task 3.2**: Run `npm run lint` — verify no new errors.

## Dependencies & Execution Order

```
Task 1.1 (create offline.html)
  └─→ Task 2.1 (pre-cache on install)
  └─→ Task 2.2 (navigation fallback chain)
  └─→ Task 2.3 (bump cache version)
        └─→ Task 1.2 (verify file size)
        └─→ Task 3.1 (build)
        └─→ Task 3.2 (lint)
```

## Implementation Strategy

**Full delivery** (all 3 phases at once) — this is a small feature with no incremental MVP. The offline page and SW changes must ship together.
