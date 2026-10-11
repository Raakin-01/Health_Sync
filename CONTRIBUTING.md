# Contributing to HealthSync

Thanks for your interest in HealthSync. This is a university Full Stack
Development project (Phase 3), and it is currently a frontend-only prototype
that runs entirely on mock data. Contributions, fixes and suggestions are
welcome.

## Code of conduct

By taking part you agree to follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Prerequisites

- [Node.js](https://nodejs.org) 20 or newer (the project is developed on Node 24;
  see `.nvmrc`). The repository uses `.nvmrc`, so `nvm use` picks the right
  version if you use nvm.
- npm (bundled with Node).

## Getting started

```bash
git clone https://github.com/OWNER/REPO.git
cd REPO
npm ci          # clean install from the lockfile
npm run dev     # start the dev server on http://localhost:5173
```

The dev server prints a local URL. Open it, then use one of the quick-login
buttons on the login page to explore each role.

## Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Produce an optimised production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the Vitest unit suite once (173 tests) |
| `npm run test:watch` | Re-run tests on change while developing |
| `node scripts/check-responsive.mjs` | Boot a throwaway dev server and check every page for horizontal overflow / console errors at 390, 768 and 1280 px |

## Before you open a pull request

1. Run `npm test` and make sure all tests pass.
2. Run `npm run build` and make sure it succeeds.
3. If you changed layout or shared components, run
   `node scripts/check-responsive.mjs` and confirm the result is `PASS`.
4. Keep your change focused. Update `docs/TESTING.md` and `README.md` when your
   change affects what they describe.
5. Fill in the pull request template.

## Code style

- Plain JavaScript (no TypeScript) and React function components.
- 2-space indentation, single quotes, no semicolons (the existing style).
- Keep pure logic (triage, the heap, the bed state machine, metrics) in
  `src/lib/*.js` with no React or DOM imports, so it stays unit-testable.
- Do not add comments that simply restate the code; explain intent instead.
- Files must be ASCII-only and use LF line endings (see `.editorconfig` and
  `.gitattributes`).

## Commit messages

Use short, imperative messages with an optional scope, for example:

```
feat(queue): sort by effective priority
fix(bed): clear reservation on expiry
docs: describe the triage scoring
test(triage): cover red-flag edge cases
```

## Branching

Create a descriptively named branch off `main` (for example
`fix/bed-expiry-toast`) and open a pull request against `main`.
