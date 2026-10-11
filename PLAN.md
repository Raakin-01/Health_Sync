# HealthSync — Frontend Plan (Steps 1–4)

HealthSync is a Hospital Resource & Bed Management System. This document covers
the approved frontend plan for **Steps 1–4** of FSD Phase 3 (Assignment 3).

- **Stack (fixed):** Vite + React (JavaScript), React Router v6, Bootstrap 5
  (`bootstrap` + `react-bootstrap`), Recharts, Vitest (tests), Playwright (screenshots).
- **No backend.** Mock data lives in `src/data`, persisted in `localStorage`.
  Browser tabs sync via `BroadcastChannel`.
- **Environment note:** Node v24.20.0 / npm 11.19.0 are installed on Windows only.
  All node/npm/npx commands are run through Windows PowerShell. Because a
  WSL-spawned PowerShell has no `C:\Program Files\nodejs` on its `PATH`, each
  command prefixes the process PATH in-memory only (no persistent PATH change,
  no shims, no WSL Node):

  ```
  powershell.exe -NoProfile -Command "\$env:Path='C:\Program Files\nodejs;'+\$env:Path; Set-Location 'C:\Users\admin\OneDrive\Desktop\fsd project'; & 'C:\Program Files\nodejs\npm.cmd' <script>"
  ```

  The dev server is started by the user, never by the assistant.

## Approved decisions

- **Store:** custom `useSyncExternalStore` pub/sub in `src/lib/store.js` (no Redux).
- **`RESERVATION_MINUTES`:** defined in `src/lib/bedMachine.js` (default 30, shorten for demos).
- **Toasts:** small custom context/component (`src/components/Toasts.jsx`).
- **Screenshots:** the `playwright` package + `scripts/screenshots.js` run via `node`.
- **Tests:** `src/lib/*.test.js` with Vitest — deferred to Step 9 (no placeholders now).

## Step 1 — Scaffold + app shell

**Deps:** react, react-dom, react-router-dom@6, bootstrap, react-bootstrap, recharts.
**Dev:** vite, @vitejs/plugin-react, vitest, jsdom, @testing-library/react, playwright.

**Files**
- `package.json` (name `healthsync`; scripts dev/build/preview/test/screenshots)
- `vite.config.js` (react plugin + Vitest jsdom/globals config)
- `index.html`
- `src/main.jsx` (imports Bootstrap CSS, `custom.css`, Router)
- `src/App.jsx` (routes + layout shell)
- `src/components/Navbar.jsx` (responsive Bootstrap navbar; role links added in Step 3)
- `src/pages/NotFound.jsx`
- `src/styles/custom.css` (blue/white theme base)

**Check:** `npm run dev` → responsive navbar collapses at narrow width; unknown route shows NotFound.

## Step 2 — Mock data + store + sync

**Files**
- `src/data/wards.js` (ICU-1 ×10, General A ×30, General B ×24, Isolation ×8; bed `id`/`type`/`status`/`patientId`/`expiresAt`)
- `src/data/patients.js` (6 patients with vitals; queue-ready)
- `src/data/users.js` (nurse/doctor/admin)
- `src/lib/store.js` (pub/sub + `useSyncExternalStore` hook; auth/beds/queue actions; localStorage persistence + hydration)
- `src/lib/sync.js` (`BroadcastChannel`, tab-id dedupe, re-post on change)

**Check:** no UI yet — inspect `localStorage` in DevTools; store hydrates from seed on first load.

## Step 3 — Login + role views (F8)

**Files**
- `src/lib/store.js` (auth: `user`, `login`, `logout`, role persistence)
- `src/pages/Login.jsx` (email+password vs `users.js` + quick-login buttons)
- `src/pages/NurseDashboard.jsx`, `DoctorQueue.jsx`, `AdminAnalytics.jsx` (stubs)
- `src/components/ProtectedRoute.jsx` (role gate → redirect)
- `src/components/Navbar.jsx` (links filtered by role; logout)
- `src/App.jsx` (wire protected routes)

**Check:** each quick-login shows only its links; other role's URL redirects; refresh keeps session.

## Step 4 — Live bed dashboard (F1, F2)

**Files**
- `src/lib/bedMachine.js` (allowed transitions + `RESERVATION_MINUTES=30`; `nextStatus`/`canTransition`)
- `src/components/WardCard.jsx`, `src/components/BedTile.jsx`, `src/components/Toasts.jsx`
- `src/pages/NurseDashboard.jsx` (ward/type/status filters; summary strip; bed modal)
- `src/pages/AdminAnalytics.jsx` (read-only dashboard mount)
- `src/lib/store.js` (bed status actions + reservation expiry sweep)
- `src/lib/sync.js` (broadcast bed changes)
- `src/styles/custom.css` (status colors + text labels)

**Check:** beds show only the allowed next status; invalid jump → toast; reservation auto-expires
(shorten constant to test); change a bed in tab A → tab B updates live.

## Steps 5–10 (later)

5. Triage scoring (`lib/triage.js`) + `TriageForm`
6. Priority queue (`lib/heap.js`) + `DoctorQueue`
7. Admin analytics (`StatCard`, charts, heatmap)
8. Polish (toasts, loading/empty states, responsive theme)
9. Vitest tests for `triage.js`, `heap.js`, `bedMachine.js`
10. Playwright screenshots (`scripts/screenshots.js`) + `PROGRESS.md`
