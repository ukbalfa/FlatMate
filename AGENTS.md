# FlatMate Dashboard - Agent Instructions

## Architecture & Data Flow
- **Next.js 16 App Router** (Turbopack dev). Only root layout (`app/layout.tsx`) is a server component — all other pages/layouts use `'use client'`.
- **Firebase Auth** via `onAuthStateChanged` in `context/AuthContext.tsx`. Profile fetched from Firestore `users` by UID, cached to localStorage under `"user"`. Dashboard layout redirects to `/login` when `loading` is false and `user` is null.
- **Firestore client SDK** (Firebase 12) for real-time reads (`onSnapshot`/`getDocs`). **firebase-admin** via Server Actions in `app/actions/` for privileged ops.
- **Roommate Account Creation** (`app/dashboard/roommates/page.tsx:138`): Uses a secondary Firebase app instance named `'Secondary'` to avoid auth state conflicts (admin creates roommates without switching session).
- **Exchange rates**: Polled from `open.er-api.com` every 10 min, cached to localStorage under `cached_rates`.
- **First run**: Login page bootstraps first admin account automatically.
- **Security headers** configured in `next.config.ts` (HSTS, X-Frame-Options, etc.).

## Provider Composition (in order)
`app/providers.tsx`: `AuthProvider` → `NotificationsProvider` → `I18nProvider` + Sonner toaster. Root layout wraps all with `ClientThemeProvider` (from `context/ThemeContext.tsx`, storage key `flatmate-theme`) **outside** `Providers`.

## Styling & Theming
- **Dark-only UI** (no theme toggle). Tailwind v4 with `@theme` tokens in `app/globals.css`. PostCSS via `@tailwindcss/postcss`.
- **Brand accent**: `#F97316` (`var(--color-accent)`).
- **CSS helpers**: `.fm-card`, `.fm-btn-primary`, `.fm-input` defined in `globals.css`.
- **Animations**: Framer Motion for complex transitions; CSS classes `animate-fade-in`, `stagger-1`–`stagger-4` for simpler cases.

## Data Conventions
- **Dates**: ISO strings (`YYYY-MM-DD`).
- **State persistence keys**: `flatmate-theme`, `flatmate-language`, `cached_rates`.
- **Firestore**: Deploy rules+indexes with `firebase deploy --only firestore:rules,firestore:indexes`. Flat-level isolation via `flatId` in security rules.

## Commands
- `npm run dev` — Next.js dev (Turbopack)
- `npm run lint` — ESLint v9 (flat config in `eslint.config.mjs`)
- `npm run build` — Production build
- `npm run test` — Jest (jsdom, ts-jest, 10 files, 103 tests). Single file: `npm run test -- __tests__/utils.test.ts`
- **Verify before commit**: `npm run lint && npm run build && npm run test`

## Environment Variables
- **Client SDK**: `NEXT_PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)
- **Server Actions**: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- **Telegram login**: `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`, `TELEGRAM_BOT_TOKEN`
- Never commit `.env.local` (listed in `.gitignore`)

## Key Conventions
- **Page components**: Default-exported named functions (`SomethingPage`).
- **Client components**: All pages/layouts except root layout use `'use client'`.
- **Role checks**: `useAuth().userProfile?.role === 'admin'` for admin-only features.
- **Import order**: React/Next → external libs → relative local imports.
- **Project structure**: `app/components/` for app-specific UI; `components/` (root) for shared components (PrimaryButton, ThemeProvider, LangSync, NoiseOverlay); `context/` for React contexts; `lib/` for utils/types/firebase setup; `constants/` for theme/animation values.
- **Landing page**: Split across `components/landing/` (shared landing components) and `app/landing/` (page sections).
- **`__tests__` excluded** from tsconfig (`"exclude": ["node_modules", "__tests__", "everything-claude-code"]`).
