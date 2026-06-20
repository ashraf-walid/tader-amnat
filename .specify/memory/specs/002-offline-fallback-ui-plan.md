# Implementation Plan: Offline Fallback UI

**Branch**: `002-offline-fallback-ui` | **Date**: 2026-06-16 | **Spec**: `specs/002-offline-fallback-ui.md`

## Summary

Create a static offline fallback page (`public/offline.html`) and update the service worker (`public/sw.js`) to pre-cache it and serve it as the last-resort navigation fallback. The page is Arabic-first, RTL, theme-aware, includes a retry button, and is fully self-contained (no external dependencies).

## Technical Context

**Language/Version**: JavaScript (ES2022), HTML5, CSS3

**Primary Dependencies**: Service Worker API, Cache API (no frameworks — static HTML)

**Storage**: Cache API (existing `CACHE_NAME` lifecycle)

**Testing**: Manual testing via DevTools offline mode

**Target Platform**: All modern browsers supporting Service Workers (Chrome, Firefox, Safari, Edge)

**Project Type**: Web application (Next.js PWA)

**Performance Goals**: <100ms render (served from SW cache, zero network)

**Constraints**: <10 KB file size, no external resources, no React, no Next.js

**Scale/Scope**: 1 new file + 1 modified file

## Constitution Check

*GATE: Must pass before implementation.*

| Principle | Status | Notes |
|-----------|:------:|-------|
| I. Arabic-First UX | PASS | Offline page is Arabic, RTL, Alexandria font via system fallback |
| II. Data Integrity & Security | PASS | No data mutation, no auth needed (offline state) |
| III. Performance & Offline Resilience | PASS | Directly improves PWA resilience; static file, zero latency |
| IV. Code Quality & Testing | PASS | Lint not applicable to static HTML; manual test plan in spec |
| V. Simplicity & Minimal Dependencies | PASS | Zero dependencies — pure HTML/CSS/JS inline |
| VI. Role-Based Access Control | PASS | N/A — no auth or role checking needed |
| VII. Domain-Specific Calculation Integrity | PASS | N/A — no calculations |

**Result**: All 7 principles pass. No violations to track.

## Project Structure

### New Files

| File | Purpose |
|------|---------|
| `public/offline.html` | Static offline fallback page (~8 KB, self-contained) |

### Modified Files

| File | Change |
|------|--------|
| `public/sw.js` | Pre-cache offline page on install; update navigation fallback chain |

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  Service Worker (sw.js)                             │
│                                                     │
│  install event:                                     │
│    skipWaiting() + cache offline.html               │
│                                                     │
│  fetch event (navigation):                          │
│    1. Try network → cache response → return         │
│    2. On fail → try cache.match(request.url)        │
│    3. On fail → try cache.match('/')                │
│    4. On fail → try cache.match('/offline.html')    │  ← NEW
│    5. On fail → inline minimal HTML response        │  ← NEW (last resort)
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Offline Page (offline.html)                        │
│                                                     │
│  <html lang="ar" dir="rtl">                         │
│    <head>                                           │
│      Inline <style> — dark/light theme variables    │
│      Inline <script> — theme detection (localStorage│
│                        + prefers-color-scheme)      │
│    </head>                                          │
│    <body>                                           │
│      WiFi-off SVG icon                              │
│      "لا يوجد اتصال بالإنترنت" (no connection)       │
│      "يرجى التحقق من اتصالك وإعادة المحاولة"       │
│      [إعادة المحاولة] button → location.reload()   │
│      أمانات branding                                │
│    </body>                                          │
└─────────────────────────────────────────────────────┘
```

### Navigation Fallback Chain (Detailed)

Current (lines 97-114 in sw.js):
```
fetch → cache.match('/') → (white screen if nothing cached)
```

New:
```
fetch → cache.match('/') → cache.match('/offline.html') → inline fallback
```

### Offline Page Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| File type | Static HTML | Cannot depend on React/Next.js being available offline |
| CSS | Inline in `<style>` | No external stylesheet dependency |
| JS | Inline in `<script>` | Theme detection only — ~100 bytes |
| Icon | Inline SVG | No image dependency; always renders |
| Font | System Arabic font stack | `system-ui, "Segoe UI", "Tahoma", sans-serif` — no Google Fonts dependency |
| Colors | CSS custom properties | Reuses same theme variables from `globals.css` |
| Retry | `window.location.reload()` | Simplest approach; reloads original URL |

### Theme Detection Script

Same pattern as `layout.js` line 46-49 — reads `localStorage.theme`, falls back to `prefers-color-scheme: dark`, sets `data-theme` on `<html>`.

## Complexity Tracking

No violations. This feature is purely additive with zero new dependencies.
