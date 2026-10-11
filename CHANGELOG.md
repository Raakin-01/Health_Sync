# Changelog

All notable changes to HealthSync are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project aims
to follow [Semantic Versioning](https://semver.org) for its pre-release builds.

## [Unreleased]

- Screenshots and a project log for the Phase 3 submission (Step 10).

## [1.0.0-phase3] - 2026-10-11

The Phase 3 (Assignment 3) frontend prototype: a hospital bed and resource
management dashboard. Everything below runs on mock data in the browser.

### Added

- **App shell and routing** - Vite + React + React Router v6 with a responsive
  Bootstrap 5 navbar, a not-found page and role-based redirects.
- **Mock data and store** - a custom `useSyncExternalStore` store
  (`src/lib/store.js`) seeded from `src/data` and persisted to `localStorage`.
- **Cross-tab live sync** (`src/lib/sync.js`) - changes in one tab update the
  others through a `BroadcastChannel`, with tab-id dedupe and echo protection.
- **Login and roles** (F8) - mock login plus per-role quick-login buttons and
  protected routes for the nurse, doctor and admin views.
- **Live bed dashboard** (F1, F2) - ward cards, four bed statuses
  (available / occupied / cleaning / reserved), filters, a summary strip and a
  bed status modal driven by a strict state machine
  (`src/lib/bedMachine.js`) with 30-minute reservations and auto-expiry.
- **Emergency intake and triage** (F3, F4) - a vitals form with live score
  preview, NEWS2-inspired scoring and a red-flag rule
  (`src/lib/triage.js`).
- **Priority queue** (F5) - a from-scratch max-heap (`src/lib/heap.js`) and
  aging priority (`src/lib/queue.js`) powering the doctor queue, with admit and
  re-check flows.
- **Admin analytics** (F6, F7) - live occupancy stat cards, a wait-time chart, a
  turnover chart, a department load heatmap and CSV export
  (`src/lib/reportMetrics.js`, `src/data/reportData.js`).
- **Real-time alerts** (F10) - rule-based alert detection
  (`src/lib/alerts.js`), a watcher and a notification bell in the navbar.
- **Polish** - toasts, loading / empty / error states, a design-token theme,
  keyboard-accessible bed tiles, `aria-live` announcements and a responsive
  layout.
- **Tests** - 173 Vitest unit tests across seven files covering triage, the heap,
  the queue, the bed state machine, reporting metrics, alert rules and the store
  (see `docs/TESTING.md`).
- **Docs** - `docs/ARCHITECTURE.md`, `docs/TESTING.md` and `docs/PLAN.md`.

### Known limitations

- No backend: data is per-browser and resets when site data is cleared.
- Login is a mock; there is no real authentication or authorization.
- Analytics historical series are clearly-labelled mock data; only the live
  measures reflect the current store.

[Unreleased]: https://github.com/OWNER/REPO/compare/v1.0.0-phase3...HEAD
[1.0.0-phase3]: https://github.com/OWNER/REPO/releases/tag/v1.0.0-phase3
