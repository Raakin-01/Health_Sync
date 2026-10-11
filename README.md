<div align="center">
  <img src="public/logo.svg" alt="HealthSync logo" width="96" height="96" />
  <h1>HealthSync</h1>
  <p><strong>Hospital Resource &amp; Bed Management System</strong></p>
  <p><em>Air traffic control for hospital beds.</em></p>
  <p>
    Real-time bed tracking, emergency triage scoring and a self-sorting
    priority queue - in one browser dashboard.
  </p>
</div>

<div align="center">

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)
![Tests](https://img.shields.io/badge/tests-173%20passing-brightgreen)
![Status](https://img.shields.io/badge/status-Phase%203%20frontend-blue)

</div>

![HealthSync nurse dashboard](docs/screenshots/03-nurse-dashboard.png)

<p align="center"><em>Nurse dashboard: live ward cards, bed tiles and filters.</em></p>

## Table of contents

- [About](#about)
- [Features](#features)
- [Demo walkthrough](#demo-walkthrough)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [Testing](#testing)
- [Accessibility and responsiveness](#accessibility-and-responsiveness)
- [Roadmap](#roadmap)
- [Disclaimer](#disclaimer)
- [Team](#team)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## About

Hospitals juggle thousands of small decisions every shift: which bed is free,
who is the sickest patient in the queue, and which ward is about to run out of
capacity. Today this often lives on whiteboards, phone calls and spreadsheets,
which is slow and easy to get wrong at exactly the moment accuracy matters.

**HealthSync** is a single dashboard that keeps the whole picture in sync:

- a **live bed board** across four wards, with a strict status workflow and
  timed reservations,
- **emergency intake** that scores a patient's vitals as they are entered,
- a **doctor queue** that always shows the most urgent patient first and lets
  waiting patients age up the list,
- **analytics** for occupancy, waits, turnover and ward load, and
- **real-time alerts** when a critical patient arrives, ICU fills up, or a bed
  is left waiting to be cleaned.

Multiple browser tabs stay in sync automatically, so a nurse's view updates the
moment a doctor admits a patient.

This repository is the **Phase 3 (Assignment 3) frontend** of a Full Stack
Development course project. It is a **frontend-only prototype**: there is no
server, and every patient, staff member and vitals reading is **mock data**
seeded in the browser. See the [Disclaimer](#disclaimer).

## Features

### Implemented

| # | Feature | What it does |
| --- | --- | --- |
| F1 | **Live bed dashboard** | Four wards (ICU-1, General A, General B, Isolation) rendered as ward cards and colour-coded bed tiles, with ward / type / status filters and a summary strip. |
| F2 | **Bed state machine** | Beds move only through `available -> reserved/occupied`, `reserved -> occupied/available`, `occupied -> cleaning`, `cleaning -> available`. Invalid jumps are blocked and explained with a toast. |
| F3 | **Emergency intake** | A vitals form for a new patient with a live triage score preview as you type. |
| F4 | **Triage scoring** | A NEWS2-inspired score over six inputs (respiratory rate, SpO2, systolic BP, heart rate, temperature, consciousness) with a red-flag rule. |
| F5 | **Priority queue** | A from-scratch max-heap orders waiting patients by `score + 0.1 * minutes waited`, so patients age up the list. Ties break on arrival time. |
| F6 | **Admin analytics** | Live occupancy cards plus wait-time and turnover charts. |
| F7 | **Ward load heatmap** | A colour-coded heatmap by ward and hour, with auto-generated insights and CSV export. |
| F8 | **Login and roles** | A mock login with per-role quick-login buttons and protected routes for the nurse, doctor and admin views. |
| F9 | **Cross-tab live sync** | Changes in one tab broadcast to the others over a `BroadcastChannel`; the signed-in role stays per tab. |
| F10 | **Real-time alerts** | A notification bell for critical arrivals, ICU occupancy crossing 90% (re-arming below 85%) and beds left cleaning for more than 45 minutes. |
| - | **Reservations and expiry** | Reserving a bed starts a 30-minute hold that auto-releases back to `available` when it expires. |
| - | **Admit and re-check** | Doctors can admit the top patient into a bed in one step, or re-check a patient's vitals and watch the score update and re-sort. |
| - | **Polish** | Toasts, loading / empty / error states, a design-token theme, keyboard-accessible bed tiles and a responsive layout. |

### Planned

These are **not built yet** and are listed for transparency. See the
[Roadmap](#roadmap).

- A real backend (REST API + PostgreSQL) to replace the browser store.
- Authenticated sessions with JWT instead of the mock login.
- Live server push (WebSockets / Socket.io) instead of same-browser tab sync.
- A dedicated discharge workflow with outcomes, and patient transfers between
  wards.
- An equipment and resource tracker alongside beds.
- Reports over real historical data rather than mock series.

## Demo walkthrough

A two-minute tour of what is implemented today. Use the quick-login buttons on
the login page.

1. **Log in as a nurse** and open the **Dashboard** (`01-login.png`,
   `03-nurse-dashboard.png`). Filter by ward or status, and click a bed to open
   the status modal (`04-bed-status-modal.png`). Try an invalid change - it is
   blocked with a toast - then reserve a bed and watch the 30-minute hold start.
2. **Open Intake** and start entering vitals for a new patient. The score
   preview updates live as you type; a single alarming vital triggers the
   red-flag rule (`07-intake-critical-preview.png`). Save the patient.
3. **Open a second tab, log in as a doctor**, and go to the **Queue**
   (`08-doctor-queue.png`). The new patient is already there, ordered by
   priority. Admit the top patient into a bed, or re-check them to update the
   score and watch the queue re-sort.
4. **Watch a patient age up the list.** A stable patient who waits long enough
   climbs above a more urgent patient who just arrived (`09-queue-aging-demo.png`).
5. **Open Analytics as the admin** (`12-admin-analytics.png`) for occupancy
   cards, wait-time and turnover charts, the ward **heatmap**
   (`13-admin-heatmap.png`) and CSV export.
6. **See the alerts.** Add a critical patient, fill up ICU, or leave a bed
   cleaning - the navbar **bell** lights up (`15-alerts-bell.png`).
7. **Watch two tabs sync.** With one tab open on a dashboard, change a bed in
   another tab and watch the first update live without a refresh
   (`19-live-sync-before.png`, `20-live-sync-after.png`).
8. **Resize the window** down to phone width to see the responsive layout
   (`21-mobile-dashboard.png`).

## Screenshots

All screenshots live in [`docs/screenshots/`](docs/screenshots). The files are
captured with Playwright during the Phase 3 submission (Step 10).

| Login and access | Live bed board |
| --- | --- |
| ![Login](docs/screenshots/01-login.png) | ![Nurse dashboard](docs/screenshots/03-nurse-dashboard.png) |
| Mock login with per-role quick-access buttons | Ward cards, colour-coded bed tiles and filters |

| Bed status modal | Emergency intake |
| --- | --- |
| ![Bed status modal](docs/screenshots/04-bed-status-modal.png) | ![Intake](docs/screenshots/07-intake-critical-preview.png) |
| Allowed transitions only, with reservation timing | Live triage score preview and red-flag warning |

| Doctor queue | Aging demo |
| --- | --- |
| ![Doctor queue](docs/screenshots/08-doctor-queue.png) | ![Queue aging](docs/screenshots/09-queue-aging-demo.png) |
| Priority-sorted waiting list with admit / re-check | A waiting patient ageing up the list |

| Admin analytics | Ward load heatmap |
| --- | --- |
| ![Analytics](docs/screenshots/12-admin-analytics.png) | ![Heatmap](docs/screenshots/13-admin-heatmap.png) |
| Occupancy, wait-time and turnover charts | Load by ward and hour, with insights |

| Alerts bell | Cross-tab live sync |
| --- | --- |
| ![Alerts](docs/screenshots/15-alerts-bell.png) | ![Sync before](docs/screenshots/19-live-sync-before.png) / ![Sync after](docs/screenshots/20-live-sync-after.png) |
| Critical / ICU / cleaning notifications | A change in one tab reflected in another |

| Mobile layout |
| --- |
| ![Mobile dashboard](docs/screenshots/21-mobile-dashboard.png) |
| The dashboard at phone width |

## Tech stack

| Layer | Choice | Version |
| --- | --- | --- |
| Build tool | [Vite](https://vite.dev) | 8 |
| UI library | [React](https://react.dev) (JavaScript, no TypeScript) | 19 |
| Routing | [React Router](https://reactrouter.com) | 6 |
| Styling | [Bootstrap 5](https://getbootstrap.com) + [react-bootstrap](https://react-bootstrap.github.io) | 5 / 2 |
| Charts | [Recharts](https://recharts.org) | 3 |
| Unit tests | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) + jsdom | 5 |
| Browser automation | [Playwright](https://playwright.dev) | 1 |
| Node | Node.js (developed on 24, requires >= 20) | - |

The app deliberately uses **no state-management library**: application state
lives in a small `useSyncExternalStore` store, and the interesting logic is in
plain JavaScript modules under `src/lib`.

## Architecture

The short version:

- A single **store** (`src/lib/store.js`) holds all state, persists it to
  `localStorage` and exposes React hooks. There is no backend.
- **Pure modules** under `src/lib` (triage, heap, queue, bed state machine,
  alerts, report metrics) hold the logic and have no React or DOM imports, which
  keeps them easy to test.
- **`BroadcastChannel`** (`src/lib/sync.js`) mirrors changes to other tabs. The
  login session is per tab (`sessionStorage`), so two tabs can run as different
  roles.

The full walkthrough - data flow, the bed state machine, the triage table, the
heap, sessions, alerts and how to extend each part - is in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Project structure

```
healthsync/
|-- public/
|   `-- logo.svg                 # App logo, also used as the favicon
|-- docs/
|   |-- ARCHITECTURE.md          # How the app is put together
|   |-- TESTING.md               # What the 173 tests cover
|   |-- PLAN.md                  # The original build plan
|   `-- screenshots/             # Screenshots used in this README
|-- scripts/
|   `-- check-responsive.mjs     # Headless overflow / console-error checker
|-- src/
|   |-- data/                    # Mock seed data
|   |   |-- wards.js             #   wards and the bed status pattern
|   |   |-- patients.js          #   patients with vitals
|   |   |-- users.js             #   demo staff accounts
|   |   `-- reportData.js        #   mock historical analytics series
|   |-- lib/                     # Pure logic (+ tests)
|   |   |-- store.js             #   useSyncExternalStore store + actions
|   |   |-- sync.js              #   cross-tab BroadcastChannel sync
|   |   |-- bedMachine.js        #   bed status state machine
|   |   |-- triage.js            #   triage scoring + validation
|   |   |-- heap.js              #   from-scratch max-heap
|   |   |-- queue.js             #   priority + aging logic
|   |   |-- alerts.js            #   alert rules
|   |   |-- reportMetrics.js     #   analytics metrics + CSV
|   |   |-- roles.js             #   role -> routes and nav links
|   |   |-- bedMeta.js           #   bed status presentation
|   |   |-- triageMeta.js        #   triage level presentation
|   |   |-- alertCenter.js       #   per-tab alert centre
|   |   |-- useNow.js            #   ticking clock hook
|   |   |-- useDocumentTitle.js  #   sets the page title
|   |   `-- *.test.js            #   Vitest unit tests
|   |-- components/              # Reusable UI (navbar, tiles, modals, ...)
|   |-- pages/                   # Login, Dashboard, Intake, Queue, Analytics
|   |-- styles/
|   |   `-- custom.css           # Design tokens + theme over Bootstrap
|   |-- test/
|   |   `-- setup.js             # Vitest setup (storage + BroadcastChannel)
|   |-- App.jsx                  # Routes and layout
|   `-- main.jsx                 # Entry point
|-- index.html
|-- vite.config.js               # Vite + Vitest config
|-- package.json
`-- README.md
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 20 or newer (developed on Node 24). The repo has
  an [`.nvmrc`](.nvmrc), so `nvm use` selects the right version.
- npm (bundled with Node).

### Install and run

```bash
git clone https://github.com/OWNER/REPO.git
cd REPO
npm ci          # clean install from the lockfile
npm run dev     # http://localhost:5173
```

Open the printed URL and use a quick-login button (see
[Demo accounts](#demo-accounts)).

### Other commands

```bash
npm run build                    # production build into dist/
npm run preview                  # serve the production build locally
npm test                         # run the unit tests once
npm run test:watch               # re-run tests on change
node scripts/check-responsive.mjs  # overflow + console-error check at 3 widths
```

## Demo accounts

The login is a **mock** - it checks the seeded demo users in
`src/data/users.js`. The login page also has one-click quick-login buttons for
each role. All accounts are fictional.

| Role | Name | Email | Password |
| --- | --- | --- | --- |
| Nurse | Grace Okafor | `nurse@healthsync.test` | `nurse123` |
| Doctor | Dr. Alan Reyes | `doctor@healthsync.test` | `doctor123` |
| Admin | Ada Mensah | `admin@healthsync.test` | `admin123` |

The **admin** role can see every page, which is convenient for a demo.

## Testing

HealthSync ships **173 unit tests** across seven files, run with Vitest:

```bash
npm test
```

| Area | Test file | Tests |
| --- | --- | --- |
| Triage scoring + validation | `src/lib/triage.test.js` | 70 |
| Max-heap | `src/lib/heap.test.js` | 10 |
| Priority queue + aging | `src/lib/queue.test.js` | 7 |
| Bed state machine | `src/lib/bedMachine.test.js` | 29 |
| Report metrics + CSV | `src/lib/reportMetrics.test.js` | 16 |
| Alert rules | `src/lib/alerts.test.js` | 27 |
| Store actions | `src/lib/store.test.js` | 14 |

The tests are deterministic (time-dependent logic takes an explicit `now`) and
isolated (storage is cleared and `BroadcastChannel` is stubbed between tests).
See [`docs/TESTING.md`](docs/TESTING.md) for the full breakdown.

## Accessibility and responsiveness

- Bed tiles are reachable and operable by keyboard, and carry descriptive
  `aria-label`s.
- Status changes are announced through `aria-live` regions, and toasts are
  announced rather than being purely visual.
- Interactive controls have visible focus rings, and colour is always paired
  with a text label (never colour alone).
- Key pages were checked with
  `node scripts/check-responsive.mjs`, which loads each role's pages at 390, 768
  and 1280 px and reports horizontal overflow or console errors. The last run
  reported **PASS** - no overflow and no console errors.

## Roadmap

Phase 4 will turn this prototype into a full-stack application. Planned work,
in rough order:

1. **Backend API** - a REST service with a PostgreSQL database for wards, beds,
   patients and staff, replacing the browser store.
2. **Real authentication** - server-issued sessions (JWT) and proper
   authorization on every endpoint.
3. **Server push** - WebSockets / Socket.io so updates are live across devices,
   not just across tabs in one browser.
4. **Clinical workflows** - a dedicated discharge workflow with outcomes, and
   patient transfers between wards.
5. **Resource tracking** - equipment and consumables alongside beds.
6. **Reporting** - analytics over real historical data instead of mock series.

> These items are planned, not built. Nothing above exists in the current code.

## Disclaimer

- This project is **for education only**. It is a Phase 3 course submission and
  is **not a medical device**.
- The triage score is **inspired by** NEWS2 (National Early Warning Score 2) but
  is **not** a validated clinical tool. Do **not** use it for real patient care
  or clinical decisions.
- All data - patients, staff, vitals and bed statuses - is **fictional and
  generated for the demo**. Nothing is sent to a server.
- The "login" is a mock and provides no real security.

## Team

**Full Stack Development - Phase 3 (Assignment 3) - Team ID: `TD_008`**

| Member |
| --- |
| Shaik Raakin |
| N Vishwas |
| Prajwal Raj |
| Chetan Halasangi |

Progress notes and the phase log are tracked in
[`PROGRESS.md`](./PROGRESS.md).

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for
the development setup and code style, and follow our
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Security reports should follow
[`SECURITY.md`](SECURITY.md).

Good starting points:

- Add tests for a metric or component that is not covered yet.
- Improve empty / loading states.
- Tidy the responsive layout at very small or very large widths.

## License

Released under the [MIT License](./LICENSE). Copyright (c) 2026 HealthSync Team
(TD_008).

## Acknowledgements

- [React](https://react.dev), [Vite](https://vite.dev) and
  [React Router](https://reactrouter.com) for the app foundation.
- [Bootstrap](https://getbootstrap.com) and
  [react-bootstrap](https://react-bootstrap.github.io) for the UI, and
  [Recharts](https://recharts.org) for the charts.
- [Vitest](https://vitest.dev), [Testing Library](https://testing-library.com)
  and [Playwright](https://playwright.dev) for testing and screenshots.
- [shields.io](https://shields.io) for the README badges, and the
  [Contributor Covenant](https://www.contributor-covenant.org) for the code of
  conduct.
