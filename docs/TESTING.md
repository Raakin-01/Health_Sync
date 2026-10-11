# Testing

HealthSync uses [Vitest](https://vitest.dev) for unit tests. The tests live next
to the code they cover (`src/lib/*.test.js`) and run in a `jsdom` environment so
they can exercise the store, which touches `window`, `localStorage` and
`BroadcastChannel`.

## How to run

From the project root:

```bash
npm test          # single run (vitest run) - use this for grading / CI
npm run test:watch  # re-runs on file change while developing
```

Both scripts are defined in `package.json`. The Vitest config lives in
`vite.config.js` under the `test` key (`environment: jsdom`, `globals: true`,
`setupFiles: ./src/test/setup.js`, `include: src/**/*.test.{js,jsx}`).

## What is covered

| Test file | What it proves | Tests |
| --- | --- | --- |
| `src/lib/triage.test.js` | The three canonical triage examples (17 critical, 5 urgent, 0 non-urgent); every band edge for all six vitals (RR, SpO2, SBP, HR, temperature, consciousness); the score-to-level thresholds (4 non-urgent, 5/6 urgent, 7 critical); the red-flag rule (a single 3-point vital forces at least urgent); and `validateVitals` accepts valid values/decimal temperature and rejects out-of-range, empty and non-numeric input. | 70 |
| `src/lib/heap.test.js` | The from-scratch `MaxHeap`: insert/peek/size, descending extraction, empty-heap safety, comparator tie-break (equal priority -> earlier arrival, then id), `updateKey` up/down moves and unknown-id handling, `remove` from the middle while preserving the heap property, non-destructive `toSortedArray`, and two seeded randomized tests that compare a full drain (and a random insert/update/remove mix) against `Array.sort`. | 10 |
| `src/lib/queue.test.js` | `effectivePriority = score + 0.1 * minutes waited`, including the aging example (score 0 waiting 80 min = 8.0 beats score 5 waiting 0, but score 17 beats both); tie-break by earlier arrival then id; and deterministic ordering for a single fixed `now`. | 7 |
| `src/lib/bedMachine.test.js` | The complete bed status x status transition matrix asserted against an expected table; `allowedNext` for every status (and that it returns a copy); `RESERVATION_MINUTES === 30`; and `isExpired` either side of the expiry boundary (inclusive at the instant). | 29 |
| `src/lib/reportMetrics.test.js` | `currentOccupancy` and `occupancyByWard` (including empty wards); `waitingNow`; `liveAverageWait` returns `null` when nobody has been admitted and averages otherwise; `heatmapColor` clamps below 0 / above 100 and stays a valid, in-range hsl colour across 0..100; `toCsv` escapes commas, quotes, newlines and mixed cells and renders null/undefined correctly. | 16 |
| `src/lib/alerts.test.js` | The F10 alert rules: threshold constants (`ICU_HIGH_THRESHOLD` 90, `ICU_REARM_THRESHOLD` 85, `CLEANING_REMINDER_MINUTES` 45); role targeting for every alert type and role; critical-patient detection; ICU occupancy crossing fires once at >= 90 and only re-arms below 85; cleaning reminders fire once per cleaning period after 45 minutes; and `minutesSince`/`wardName` behaviour. | 27 |
| `src/lib/store.test.js` | The store actions: `setBedStatus` accepts valid transitions (and stamps reservation expiry) and rejects invalid/no-op/unknown beds; `admitPatient` moves patient + bed in one commit and rejects non-waiting patients or unavailable beds; `reassessPatient` rescales the score and appends history (and rejects invalid vitals); `addPatient` scores and stamps arrival/history. State is reset between tests. | 14 |

Total: **173 tests across 7 files.**

## How the tests stay deterministic and isolated

- **No real waiting.** Time-dependent logic takes an explicit `now` argument
  (`effectivePriority`, `minutesWaited`, `minutesSince`, `overdueCleaningBeds`,
  `isExpired`, `wardOccupancyPercent` tests), so nothing depends on the clock.
- **Seeded randomness.** The heap's randomized tests use a tiny in-file
  `mulberry32` PRNG, so "random" runs are repeatable and reproducible.
- **Isolation.** `src/test/setup.js` clears `localStorage`/`sessionStorage`
  after every test and replaces `BroadcastChannel` with a no-op, so no real
  cross-tab channel is opened. `store.test.js` also calls `logout()` + `reset()`
  in `beforeEach` and closes the sync channel in `afterAll`.

## Two conventions worth knowing (for the viva)

- **Heap direction.** `MaxHeap` is generic: its comparator returns negative when
  `a` should come out *before* `b`, and index 0 holds whichever item comes
  first. A plain descending numeric max-heap therefore passes `(a, b) => b - a`.
  The queue uses the same convention with its effective-priority comparator.
- **Stateful alert rules.** `src/lib/alerts.js` is pure - it exports the
  thresholds and predicate helpers. The "have I already fired this?" latches
  (seen critical ids, ICU occupancy latch, reminded cleaning beds) live in
  `src/components/AlertWatcher.jsx`. `alerts.test.js` pins down the pure rules
  and the threshold constants, and mirrors the small latch logic to prove the
  documented fire-once / re-arm behaviour.

No production code was modified in order to make these tests pass.
