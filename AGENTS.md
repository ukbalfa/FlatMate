# FlatMate Dashboard - Agent Instructions

## Architecture & Data Flow
- **Next.js 16.2.2 (App Router)**: Core framework. All routing follows App Router conventions in the `app/` directory.
- **Client-Side Auth**: Uses Firebase Auth via `onAuthStateChanged` in `context/AuthContext.tsx`. On auth state change, fetches user profile from Firestore `users` collection by UID and stores it in localStorage under key "user". Protected pages use `useAuth()` hook - if `loading` is false and `user` is null, dashboard layout redirects to `/login`. Role-based UI controlled via `role` field (`admin` vs `roommate`).
- **Firebase/Firestore**: Client components use Firebase 12 SDK for real-time data (`onSnapshot`/`getDocs`). Privileged operations use `firebase-admin` via Next.js Server Actions in `app/actions/`.
- **External APIs**: Live exchange rates polled from `open.er-api.com` every 10 minutes.
- **First Run**: Login page guides bootstrapping first admin account.

## Provider Composition
- **Root layout** (`app/layout.tsx`) wraps children with `ClientThemeProvider` (custom ThemeContext, storage key `flatmate-theme`) **outside** `Providers`.
- **Providers** (`app/providers.tsx`) composes: `AuthProvider` → `NotificationsProvider` → `I18nProvider` + Sonner toaster.
- **Dashboard layout** (`app/dashboard/layout.tsx`) is the route guard - redirects unauthenticated users to `/login`.
- **Only server component**: Root layout. All other pages/layouts use `'use client'`.

## Styling & Theming
- **Tailwind CSS v4**: Theme tokens defined via `@theme` in `app/globals.css`.
- **Brand Accent**: `#F97316` (`var(--color-accent)`).
- **CSS Helper Classes**: `.fm-card`, `.fm-btn-primary`, `.fm-input` defined in `globals.css`.
- **Dark/Light Mode**: Managed by custom `ThemeContext` via `ClientThemeProvider` in root layout.
- **Animations**: Framer Motion for complex transitions; CSS helpers (`animate-fade-in`, `stagger-1`) for simpler cases.

## Data Conventions
- **Date Storage**: ISO strings (`YYYY-MM-DD`).
- **State Persistence Keys**: `flatmate-theme`, `flatmate-language`, `cached_rates`.
- **Roommate Auth**: Uses secondary Firebase app instance (`Secondary`) for account creation.
- **Firebase Setup**: Deploy rules with `firebase deploy --only firestore:rules` and seed initial `users` document with username (email), name, role (admin/roommate), color (hex), joinedAt (ISO date).

## Workflow & Commands
- **Dev**: `npm run dev` (Next.js dev server with Turbopack).
- **Lint**: `npm run lint` (ESLint). Single file: `npm run lint -- path/to/file.tsx`.
- **Build**: `npm run build` (verifies production build).
- **Test**: `npm run test` (Jest, 7 tests in `__tests__/`). Single file: `npm run test -- __tests__/utils.test.ts`.
- **Verify before commit**: `npm run lint && npm run build && npm run test`.

## Environment Variables
- **Client SDK**: `NEXT_PUBLIC_FIREBASE_*` (API key, auth domain, project ID, storage bucket, messaging sender ID, app ID).
- **Server Actions**: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
- **Never commit `.env.local`** - it's in `.gitignore`.

## Key Conventions
- **No path aliases**: Use relative imports (tsconfig `@/*` alias exists but is only for Jest's `moduleNameMapper`).
- **Page components**: Default-exported named functions (`SomethingPage`).
- **Client components**: All pages/layouts except root layout use `'use client'`.
- **Role-based writes**: Check `useAuth()` for `userProfile?.role === 'admin'`.
- **Import order**: React/Next → external libs → relative local imports.
- **Project Structure**: 
  - `app/` - Next.js App Router pages and layouts
  - `components/` - Shared UI components
  - `constants/` - Application constants
  - `context/` - React contexts (Auth, I18n, Notifications)
  - `lib/` - Utility functions and Firebase setup
  - `public/` - Static assets