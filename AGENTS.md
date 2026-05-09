# FlatMate Dashboard - Agent Instructions

This file contains high-signal, repo-specific instructions to help AI agents work effectively in this repository.

## Architecture & Data Flow
- **Next.js 16 (App Router)**: Core framework. Ensure all routing follows the App Router (`app/` directory) conventions.
- **Client-Side Auth**: Authentication uses Firebase Auth via `onAuthStateChanged` listener in `context/AuthContext.tsx`. On auth state change, it fetches the user profile from the Firestore `users` collection by UID. Protected pages use the `useAuth()` hook — if `loading` is false and `user` is null, the dashboard layout redirects to `/login`. Role-based UI is controlled via the `role` field (`admin` vs `roommate`).
- **Firebase / Firestore**: Client components use Firebase 12 SDK for real-time data (`onSnapshot` / `getDocs`). Privileged operations use `firebase-admin` via Next.js Server Actions (located in `app/actions/`).
- **External APIs**: Live exchange rates are polled from `open.er-api.com`.

## Provider Composition
- **Root layout** (`app/layout.tsx`) wraps children with `ClientThemeProvider` (custom ThemeContext, storage key `flatmate-theme`) **outside** `Providers`, then `Providers` (`app/providers.tsx`) composes `AuthProvider -> NotificationsProvider -> I18nProvider` + Sonner toaster.
- **Dashboard layout** (`app/dashboard/layout.tsx`) is the route guard - redirects unauthenticated users to `/login`.
- **Root layout** is the only server component; all other pages/layouts use `'use client'`.

## Styling & Theming
- **Tailwind CSS v4**: Theme tokens defined via `@theme` in `app/globals.css`.
- **Brand Accent**: `#F97316` (`var(--color-accent)`).
- **CSS Helper Classes**: `.fm-card`, `.fm-btn-primary`, `.fm-input`, etc. defined in `globals.css`.
- **Dark/Light Mode**: Managed by custom `ThemeContext` via `ClientThemeProvider` in root layout (`app/layout.tsx`), NOT in `app/providers.tsx`.
- **Animations**: Use Framer Motion for complex transitions/interactions and CSS helper classes (e.g., `animate-fade-in`, `stagger-1`) defined in `globals.css` for simpler cases.

## Data Conventions
- **Date Storage**: Business records store dates as ISO strings (`YYYY-MM-DD`).
- **State Persistence Keys**: `flatmate-theme`, `flatmate-language`, `cached_rates` (do not change unless migrating).
- **Roommate Auth**: Uses a secondary Firebase app instance (`Secondary`) for creating roommate accounts via `app/dashboard/roommates/page.tsx`.

## Workflow & Commands
- **Dev**: `npm run dev` (Next.js dev server with Turbopack).
- **Lint**: `npm run lint` before committing. Single file: `npm run lint -- path/to/file.tsx`
- **Build**: `npm run build` to verify production compiles.
- **Test**: `npm run test` runs Jest (7 tests in `__tests__/`). Single file: `npm run test -- __tests__/utils.test.ts`
- **Verify before commit**: `npm run lint && npm run build && npm run test`

## Environment Variables
- Firebase configuration goes into `.env.local`. Never commit this file or expose secrets in client code.
- Client SDK vars: `NEXT_PUBLIC_FIREBASE_*` (API key, auth domain, project ID, storage bucket, messaging sender ID, app ID).
- Server Actions (`firebase-admin`) require: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

## Key Conventions
- **No path aliases**: Use relative imports, not `@/*`. tsconfig path alias `@/*` exists but is only used by Jest's `moduleNameMapper` for test resolution — real code uses relative imports.
- Page components are default-exported named functions (`SomethingPage`).
- Every page/layout except root layout uses `'use client';` at the top.
- Role-based writes: check `useAuth()` for `userProfile?.role === 'admin'`.
- Import order: React/Next -> external libs -> relative local imports.