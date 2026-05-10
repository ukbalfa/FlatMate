# FlatMate Dashboard - Agent Instructions

## Architecture & Data Flow
- **Next.js 16.2.2 (App Router)**: Core framework. All routing follows App Router conventions in the `app/` directory.
- **React 19.2.4** with TypeScript strict mode (`noUncheckedIndexedAccess` enabled).
- **Client-Side Auth**: Firebase Auth via `onAuthStateChanged` in `context/AuthContext.tsx`. On auth state change, fetches user profile from Firestore `users` collection by UID and stores in localStorage under key `"user"`. Protected pages use `useAuth()` hook — if `loading` is false and `user` is null, dashboard layout redirects to `/login`. Role-based UI via `role` field (`admin` vs `roommate`).
- **Firebase/Firestore**: Client components use Firebase 12 SDK for real-time data (`onSnapshot`/`getDocs`). Privileged operations use `firebase-admin` via Next.js Server Actions in `app/actions/`.
- **Firestore Collections**: `users` · `expenses` · `tasks` · `cleaning` · `settlements` · `announcements` · `notifications` · `recurringExpenses` · `flats`.
- **Roommate Account Creation**: Uses a secondary Firebase app instance named `'Secondary'` to avoid auth state conflicts (see `app/dashboard/roommates/page.tsx:138`).
- **External APIs**: Live exchange rates from `open.er-api.com` every 10 minutes, cached in localStorage under `cached_rates`.
- **First Run**: Login page guides bootstrapping first admin account.

## Provider Composition
- **Root layout** (`app/layout.tsx`) wraps children with `ClientThemeProvider` (custom ThemeContext, storage key `flatmate-theme`) **outside** `Providers`.
- **Providers** (`app/providers.tsx`) composes: `AuthProvider` → `NotificationsProvider` → `I18nProvider` + Sonner toaster.
- **Dashboard layout** (`app/dashboard/layout.tsx`) is the route guard — redirects unauthenticated users to `/login`.
- **Only server component**: Root layout. All other pages/layouts use `'use client'`.

## Styling & Theming
- **Dark-only UI** — no theme toggle. Forced dark palette (`#050505`–`#0A0A0A` backgrounds).
- **Tailwind CSS v4**: Theme tokens defined via `@theme` in `app/globals.css`.
- **Brand Accent**: `#F97316` (`var(--color-accent)`).
- **CSS Helper Classes**: `.fm-card`, `.fm-btn-primary`, `.fm-input` defined in `globals.css`.
- **Animations**: Framer Motion for complex transitions; CSS helpers (`animate-fade-in`, `stagger-1`) for simpler cases.
- **Noise overlay**: Subtle grain texture via SVG on layout background.

## Data Conventions
- **Date Storage**: ISO strings (`YYYY-MM-DD`).
- **State Persistence Keys**: `flatmate-theme`, `flatmate-language`, `cached_rates`.
- **Firebase Setup**: Deploy rules with `firebase deploy --only firestore:rules` and seed initial `users` document with username (email), name, role (admin/roommate), color (hex), joinedAt (ISO date).

## Workflow & Commands
- **Dev**: `npm run dev` (Next.js dev server with Turbopack).
- **Lint**: `npm run lint` (ESLint).
- **Build**: `npm run build` (verifies production build).
- **Test**: `npm run test` (Jest, 10 test files, 103 tests in `__tests__/`). Single file: `npm run test -- __tests__/utils.test.ts`.
- **Verify before commit**: `npm run lint && npm run build && npm run test`.

## Environment Variables
- **Client SDK**: `NEXT_PUBLIC_FIREBASE_*` (API key, auth domain, project ID, storage bucket, messaging sender ID, app ID).
- **Server Actions**: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
- **Never commit `.env.local`** - it's in `.gitignore`.

## Key Conventions
- **Page components**: Default-exported named functions (`SomethingPage`).
- **Client components**: All pages/layouts except root layout use `'use client'`.
- **Role-based writes**: Check `useAuth()` for `userProfile?.role === 'admin'`.
- **Import order**: React/Next → external libs → relative local imports.
- **Project Structure**:
  - `app/` - Next.js App Router pages and layouts
  - `app/components/` - App-specific UI components (Avatar, ConfirmModal, FlatConnectionModal, etc.)
  - `components/` (root) - Shared components (ui/PrimaryButton, ClientThemeProvider, LangSync, NoiseOverlay)
  - `constants/` - Application constants
  - `context/` - React contexts (Auth, I18n, Notifications)
  - `lib/` - Utility functions and Firebase setup
  - `public/` - Static assets