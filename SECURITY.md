# Security Policy

## Scope

HealthSync is a **frontend-only prototype**. It has no server, no database and
no real user accounts. All data - staff accounts, patients, vitals and bed
statuses - is fictional and lives in the browser's `localStorage` /
`sessionStorage`. As a result there is no real patient or personal data to
protect, and the "passwords" in `src/data/users.js` are demo values, not
secrets.

## Supported versions

This is a course project, so only the latest `main` branch is supported.

| Version | Supported |
| --- | --- |
| `1.0.0-phase3` | Yes |
| older snapshots | No |

## Reporting a vulnerability

If you believe you have found a security issue (for example, a way to make the
app leak the demo data, a dependency advisory, or a stored-XSS vector), please
report it privately:

1. Prefer GitHub's **"Report a vulnerability"** button under the repository's
   *Security* tab (private advisory), or
2. Open a regular issue **without** sensitive details and ask for a private
   channel.

Please include:

- a description of the issue and its impact,
- steps to reproduce, and
- any suggested fix if you have one.

We aim to acknowledge reports within a few days. Please do not open a public
issue that contains exploit details before we have had a chance to respond.

## What is explicitly not a vulnerability

- The demo credentials shown on the login page and documented in the README.
- The absence of authentication hardening: this prototype has no backend and
  the login is intentionally a mock.
- Data visible in `localStorage` / `sessionStorage`: it is all seeded mock data.
