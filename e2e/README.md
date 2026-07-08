# eOffice E2E (Playwright)

Browser end-to-end specs for the demo-critical flows, added during the pre-demo QA
hardening pass. They drive Chromium against the running dev servers.

## Prerequisites

Both servers must be running:

```bash
# terminal 1 — backend
cd demo/server && npm run dev          # :4000

# terminal 2 — frontend
cd demo && npm run dev                 # :3000
```

Start from a **clean seeded DB** so counts/assertions are stable:

```bash
cd demo/server && npm run db:reset
```

## Install & run

Playwright is not yet a project dependency. One-time setup:

```bash
cd demo
npm i -D @playwright/test
npx playwright install chromium
```

Run the specs:

```bash
cd demo
npx playwright test -c e2e/playwright.config.ts
# headed / debug:
npx playwright test -c e2e/playwright.config.ts --headed
```

## Specs

- `auth.spec.ts` — login (quick-login), session persists across reload, logout clears
  session, deep-link while logged out redirects to the login screen.
- `workflow.spec.ts` — golden path: Rajesh (Maker) creates a file → forwards to Priya
  (Checker) → Priya checks → Amit (Approver) approves → file shows APPROVED. Also asserts
  a stored `<script>` subject renders as **escaped text** (no XSS execution).

> Note: these specs use the seed accounts (all `password123`) and the quick-login buttons
> on the sign-in screen. They assume the clean seed. Re-run `npm run db:reset` between runs.
