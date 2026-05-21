# AGENTS.md — FlatMate

## Project Overview

Next.js 16 (App Router) co-living management app with Firebase Firestore backend. Real-time expense splitting, chore management, balance settlement, and multi-currency support.

## Developer Commands

```bash
npm run dev    # Dev server (Turbopack)
npm run build  # Production build
npm run lint   # ESLint (flat config)
npm run test   # Jest (passes if no tests exist)
```

All scripts prefix with `NODE_OPTIONS='--no-deprecation'`. Use this if running Node commands directly.

Run a single test: `npm run test -- <path>` (e.g. `npm run test -- __tests__/utils.test.ts`)

## Architecture

- **App Router** under `app/`. Protected routes under `app/dashboard/` require a valid session cookie (`fm_session`).
- **Proxy** (`proxy.ts`) guards `/dashboard/*` → redirects to `/login`. Authenticated users on `/login` redirect to `/dashboard`.
- **Server Actions** in `app/actions/` use Firebase Admin SDK for privileged operations (create/delete data). Client UI uses Firebase Client SDK directly.
- **API routes** under `app/api/` — currently only `api/auth/` for session management and Telegram Auth.
- **Client SDK** (`lib/firebase.ts`) uses proxy fallbacks so the app doesn't crash if Firebase is unconfigured. Firestore has persistent multi-tab caching enabled.
- **Admin SDK** (`lib/firebase-admin.ts`) lazily initializes from `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. Throws if credentials missing.
- **Session** (`lib/session.ts`) — JWT encrypted with `jose` (HS256), 14-day expiry. Cookie name: `fm_session`.

## Directory Boundaries

| Path | Purpose |
|---|---|
| `app/` | Next.js App Router pages, layouts, server actions, API routes |
| `app/dashboard/` | Protected area: expenses, balances, cleaning, tasks, roommates, settings, rates, announcements, flat |
| `components/` | Root-level shared components (theme provider, landing page) |
| `app/components/` | Dashboard-scoped components |
| `context/` | React Context providers: Auth, I18n, Notifications, Theme |
| `lib/` | Firebase clients, session, types, hooks, utilities |
| `__tests__/` | Jest test files |

## Key Conventions & Quirks

- **CSP (Content Security Policy)**: Configured strictly in `next.config.mjs`. If adding third-party scripts, images, or APIs, they **must** be whitelisted in `next.config.mjs` or they will be silently blocked in browser.
- **Firestore Data Isolation (Custom Claims)**: Documents in tenant-isolated collections (`expenses`, `tasks`, `cleaning`, `announcements`) **must** include a `flatId` field. `firestore.rules` enforces that `request.resource.data.flatId == request.auth.token.flatId`.
- **Path alias**: `@/*` → `./*` (configured in tsconfig.json and jest.config.ts)
- **Strict TypeScript**: `noUncheckedIndexedAccess: true` — indexed access returns `T | undefined`.
- **Unused Variables**: `eslint.config.mjs` enforces the `@typescript-eslint/no-unused-vars` rule. Prefix intentionally unused variables with `_`.
- **i18n**: All translations inline in `context/I18nContext.tsx`. Languages: `en`, `ru`, `uz`. Use `t(key)` from context.
- **Styling**: Tailwind CSS v4 with dark-mode glassmorphic design. Framer Motion for animations.
- **Firestore**: Real-time via `onSnapshot` inside `lib/hooks/`.
- **Profile caching**: AuthContext caches `UserProfile` to `localStorage` under key `user`.
- **Exchange rates**: Polls `open.er-api.com` every 10 minutes with dedicated caching layer.

## Setup Notes

- Copy `.env.example` → `.env.local` before running. Requires Firebase client + admin credentials, hCaptcha keys, Telegram OAuth keys, and `SESSION_SECRET`.
- Deploy Firestore rules and indexes before testing protected features: `firebase deploy --only firestore:rules,firestore:indexes`
- Tests use `next/jest` with `jest-environment-jsdom`. Setup file: `jest.setup.ts` (imports `@testing-library/jest-dom`).

## Firebase Deployment

Firestore rules (`firestore.rules`) and indexes (`firestore.indexes.json`) are version-controlled. Deploy with Firebase CLI — they are NOT auto-deployed by npm scripts.