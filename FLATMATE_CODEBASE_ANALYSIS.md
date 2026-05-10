# FlatMate — Codebase Analysis

## 1. THE BIG PICTURE

**Project Name:** FlatMate
**The Elevator Pitch:** FlatMate is a co-living management web app that helps roommates split bills, track chores, manage expenses, and communicate — all in one place. It's built for shared apartments and includes real-time currency conversion, recurring expense tracking, and a clean dark-mode UI.
**The Problem:** Roommates living together often struggle with tracking shared expenses, splitting bills fairly, coordinating cleaning schedules, and managing household finances — especially in multi-currency environments (the app targets Uzbekistan with UZS as the primary currency). FlatMate solves this by centralizing all household management into a single, real-time synced dashboard.
**Target Audience:** Young professionals, students, and anyone sharing an apartment — primarily in Tashkent, Uzbekistan.

---

## 2. CORE FEATURES & FUNCTIONALITY (MVP)

**Must-Have Features:**
1. **Expense Tracking** — Add/view/delete expenses with categories (Rent, Groceries, Utilities, Internet, Misc), split with roommates, attach receipts, and mark as recurring
2. **Bill Splitting** — Split expenses equally or by custom amounts among selected roommates
3. **Balances & Settlements** — See who owes whom, record payments, view settlement history with admin delete capability
4. **Chore/Cleaning Management** — Weekly rotating cleaning schedule with day assignment, done tracking, and notifications
5. **Task Manager** — Shared to-do list with due dates, assignments, overdue tracking, and status badges
6. **Live Exchange Rates** — Real-time currency conversion (USD/EUR/RUB/KRW to UZS) with rate source toggling and favorites
7. **Roommate Management** — Add/remove/edit roommates with roles (admin/roommate), profile colors, and contact info (phone, Telegram, Instagram)
8. **Announcements** — Pin-able announcements with color coding and system notifications to all roommates
9. **Notifications** — Real-time Firestore-powered notifications for tasks, expenses, cleaning assignments, and announcements
10. **Recurring Expenses** — Auto-generate recurring expenses (daily/weekly/monthly/yearly) with pattern-based scheduling
11. **Settings** — Profile editing, password change, email verification, notification preferences, profile color selection
12. **Authentication** — Firebase Auth with email/password, role-based access (admin vs roommate), first-run admin setup

**User Flow:**
1. User opens the app → sees Landing Page with features
2. If no account → Login page with "Initialize First Admin" option
3. After login → Redirected to Dashboard
4. Dashboard shows: stats cards (expenses, tasks, cleaning, roommates), quick actions, activity feed, rent countdown, monthly overview
5. Navigate to specific sections via sidebar: Expenses, Rates, Balances, Cleaning, Tasks, Roommates, Settings, Announcements
6. Perform actions (add expense, create task, record settlement, etc.) with real-time Firestore sync
7. Admin-only actions visible only when `userProfile?.role === 'admin'`

**User Roles:**
- **Admin:** Full access — can add/remove roommates, delete expenses/settlements/tasks/cleaning items, mark rent as paid, post announcements, edit own profile
- **Roommate:** Can add expenses, view balances, update own tasks/cleaning, view announcements, edit own profile — cannot manage other users

---

## 3. TECH STACK & INFRASTRUCTURE

**Frontend:** Next.js 16.2.2 (App Router) with `'use client'` directives on all pages/layouts except root layout. Server Actions used for privileged operations (`deleteRoommate.ts`).

**Backend/Firebase:**
- **Firebase Auth** — Email/password authentication with `onAuthStateChanged` listener
- **Cloud Firestore** — Real-time data sync via `onSnapshot`. Collections: `users`, `expenses`, `tasks`, `cleaning`, `announcements`, `settlements`, `recurringExpenses`, `notifications`, `settings`
- **firebase-admin** — Server-side admin SDK for `deleteRoommate` action (verifies ID token, checks admin role, same-flat protection, deletes Auth user + Firestore doc)

**State Management:** React Context (AuthContext, NotificationsContext, I18nContext, ThemeContext). No Redux/Zustand.

**Styling:** 
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Custom theme tokens via `@theme` in `globals.css`
- Brand accent: `#F97316` (orange)
- Forced dark mode for dashboard, light mode for landing page
- CSS helper classes: `.fm-card`, `.fm-btn-primary`, `.fm-input`, `.fm-select`, `.fm-checkbox`
- Framer Motion for complex animations/gestures
- CSS keyframe animations for simpler transitions

**UI Libraries:**
- `@mantine/core` v9.1.1 (imported but not heavily used in the codebase)
- `lucide-react` for icons (Lucide icon set)
- `sonner` for toast notifications
- `react-circular-progressbar` (imported but not actively used in visible pages)
- `recharts` (imported but not actively used)
- `react-dropzone` (imported but receipt upload is simulated)

**Third-Party Integrations:**
- Firebase Auth + Firestore (primary backend)
- Open Exchange Rates API planned for live rate polling (currently mocked with randomization)
- Firebase Admin SDK for server-side operations

**Hosting:** Designed for Vercel deployment (Next.js App Router). Firebase CLI for Firestore rules deployment: `firebase deploy --only firestore:rules`.

---

## 4. UI/UX & DESIGN

**Design Style:** Premium dark-mode dashboard with glassmorphism cards, subtle gradients, and accent color highlights. Clean, modern aesthetic with generous spacing and rounded corners.

**Color Palette:**
- Background: `#0A0A0A` (near-black)
- Card background: `rgba(255,255,255,0.03)` (glass effect)
- Accent: `#F97316` (orange), `#EA6D0E` (hover), `#84CC16` (lime green), `#FBBF24` (gold)
- Text: `#FFFFFF` headings, `rgba(255,255,255,0.7)` body, `rgba(255,255,255,0.4)` muted
- User colors: Blue, Amber, Purple, Teal, Rose

**Typography:**
- Display: Sora (100-800 weights)
- Body: DM Sans (400, 500, 600)
- Mono: DM Mono (500) for data/numbers
- Headlines: Space Grotesk (700), Syne (800)
- Serif: Cormorant Garamond (700), Bebas Neue (400)

**Responsiveness:** Mobile-first with responsive grids. Sidebar collapsible on mobile with hamburger menu and overlay. Dashboard adapts from 4-column → 2-column → 1-column layouts.

**Animations:**
- Framer Motion for page transitions, card hover effects, modal animations
- CSS `@keyframes` for fade-in, slide-down, pulse effects
- Staggered animation delays using Tailwind classes (`.stagger-1` through `.stagger-4`)
- `prefers-reduced-motion` media query respected

---

## 5. DATA & SECURITY

**Core Data Models (Firestore Collections):**

| Collection | Key Fields | Purpose |
|---|---|---|
| `users` | uid, username, name, surname, role, color, occupation, phone, telegram, instagram, joinedAt | Roommate profiles |
| `expenses` | flatId, amount, category, paidBy, date, note, receiptUrl, isRecurring, splitWith, recurrencePattern, parentExpenseId | Expense tracking |
| `recurringExpenses` | flatId, amount, category, paidBy, startDate, endDate, pattern, nextDueDate, lastGeneratedDate | Recurring expense templates |
| `tasks` | text, done, assignedTo, dueDate, createdBy, createdAt | Shared task list |
| `cleaning` | task, assignedTo, dayOfWeek, weekStart, done | Weekly cleaning schedule |
| `announcements` | title, content, createdBy, createdAt, pinned, color | Flat announcements |
| `settlements` | from, to, amount, date, note, status, createdAt | Payment records between roommates |
| `notifications` | userId, title, message, type, read, createdAt, link, data | User notifications |
| `settings` | rentDueDay, rentPaidThisMonth, lastPaidMonth | Flat-level settings |

**Authentication:**
- Firebase Auth with email/password
- Auth state change listener via `onAuthStateChanged`
- User profile fetched from Firestore `users` collection by UID on auth state change
- Profile stored in React context (not localStorage, though theme is persisted to localStorage under `flatmate-theme`)

**Authorization:**
- Firestore rules: authenticated users can read/write most collections
- `users`: self-read/write + admin read-all/admin-delete
- `notifications`: user can only access their own
- Admin-only UI elements gated by `userProfile?.role === 'admin'` check in client components
- Server Action `deleteRoommateAction` verifies admin role via Firestore, verifies same flat, prevents self-deletion, and verifies ID token

---

## 6. DEPLOYMENT & NON-FUNCTIONAL REQUIREMENTS

**Hosting:** Vercel (Next.js App Router optimized)
**Build:** `npm run build` — Next.js production build with tree-shaking
**Dev:** `npm run dev` — Next.js dev server (Turbopack available)
**Performance:** Designed for small teams (2-10 roommates per flat). Real-time sync via Firestore `onSnapshot` listeners. Index management via `firestore.indexes.json`.
**SEO:** Landing page has full SEO with structured data (JSON-LD), Open Graph, Twitter Card, canonical URLs, and multilingual alternate links (en-US, es-ES). Dashboard pages are behind authentication so SEO is not a concern for them.

---

## 7. CODING PREFERENCES

**Language:** TypeScript strictly throughout.
**Code Style:**
- Client components use `'use client'` directive
- Default-exported named page components
- Import order: React/Next → external libs → relative local imports
- Path aliases (`@/*`) configured in tsconfig for imports but `components/`, `context/`, `lib/`, `constants/` also used directly
- No comments in code (clean, self-documenting style with descriptive variable names)
- Functional programming patterns (hooks, useMemo, useCallback)
- Error handling via try/catch with `logError()` utility and Sonner toasts

**Testing:** Jest with `@testing-library/react` and `@testing-library/jest-dom`. Tests located in `__tests__/`:
- `ConfirmModal.test.tsx`
- `EmptyState.test.tsx`
- `export.test.ts`
- `I18nContext.test.tsx`
- `recurringExpensesEngine.test.ts`
- `Spinner.test.tsx`
- `utils.test.ts`

Run with: `npm run test` (or `npm run test -- __tests__/utils.test.ts` for single file)

**Lint:** ESLint v9 with `eslint-config-next`
Run with: `npm run lint`

**Verification before commit:** `npm run lint && npm run build && npm run test`

---

## 8. CURRENT STATE & KEY FILE STRUCTURE

**What's built:** A nearly complete MVP with all major features implemented. The codebase is production-quality with proper error handling, i18n support, real-time sync, auth guards, and a polished dark-mode UI.

**Full directory structure:**

```
/flatmate-project-demo/
├── app/
│   ├── layout.tsx              # Root layout with fonts, metadata, SEO structured data
│   ├── page.tsx                # Landing page with structured data
│   ├── providers.tsx           # Provider composition (Auth → Notifications → I18n)
│   ├── globals.css             # Tailwind + custom theme tokens, CSS helpers
│   ├── not-found.tsx
│   ├── favicon.ico
│   ├── actions/
│   │   └── deleteRoommate.ts   # Server Action for admin roommate deletion
│   ├── components/
│   │   ├── ConfirmModal.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── NotificationsDropdown.tsx
│   │   ├── RentCountdown.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Spinner.tsx
│   │   └── ui/PrimaryButton.tsx
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard sidebar, topbar, auth guard
│   │   ├── page.tsx            # Dashboard home with stats, activity feed
│   │   ├── announcements/page.tsx
│   │   ├── balances/page.tsx   # Who-owes-whom, settlements, payment recording
│   │   ├── cleaning/page.tsx   # Weekly cleaning schedule management
│   │   ├── expenses/
│   │   │   ├── page.tsx        # Expense list, add form, analytics, budget trackers
│   │   │   └── components/
│   │   │       ├── AnalyticsDashboard.tsx
│   │   │       ├── BudgetTracker.tsx
│   │   │       ├── ExpenseCard.tsx
│   │   │       ├── ReceiptUpload.tsx
│   │   │       └── SplitExpenseModal.tsx
│   │   ├── rates/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── ConverterForm.tsx
│   │   │       ├── ExchangeRateCard.tsx
│   │   │       ├── FavoritesBar.tsx
│   │   │       ├── RateChart.tsx
│   │   │       └── SourceToggle.tsx
│   │   ├── roommates/page.tsx  # Add/edit/remove roommates
│   │   ├── settings/page.tsx   # Profile, security, notification preferences
│   │   └── tasks/page.tsx      # Shared task management
│   ├── login/
│   │   └── page.tsx            # Login + first admin setup
│   └── landing/
│       ├── HeroSection.tsx, FeaturesSection.tsx, etc.
├── components/                 # Shared/landing components
│   ├── ClientThemeProvider.tsx
│   ├── LangSync.tsx
│   ├── NoiseOverlay.tsx
│   └── landing/               # Landing page sub-components
├── context/
│   ├── AuthContext.tsx         # Firebase auth state + user profile
│   ├── I18nContext.tsx         # trilingual (en/ru/uz) i18n
│   ├── NotificationsContext.tsx
│   └── ThemeContext.tsx
├── constants/
│   ├── animations.ts
│   └── theme.ts
├── lib/
│   ├── firebase.ts            # Firebase app/init (client SDK)
│   ├── utils.ts               # getMonday, cn, formatTimeAgo
│   ├── errorLogger.ts         # Dev-only error logging
│   ├── export.ts              # CSV export + yearly summary
│   ├── motion.ts              # prefers-reduced-motion hook
│   └── recurringExpensesEngine.ts  # Batch-generates recurring expenses
├── __tests__/                 # Jest test suite (7 test files)
├── firebase.json
├── firestore.rules            # Security rules for all collections
├── firestore.indexes.json
├── next.config.ts
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

**Key observations about the codebase quality:**
- Clean separation of concerns (contexts, lib utilities, server actions, UI components)
- Comprehensive i18n with 570+ translation keys across en/ru/uz
- Proper error boundaries and loading states throughout
- Real-time Firestore sync with `onSnapshot` in every data-dependent page
- Role-based UI with admin-only actions properly gated
- Mobile-responsive with collapsible sidebar
- Accessibility considerations (aria-labels, keyboard navigation, prefers-reduced-motion)
- Some hardcoded mock data (roommates in SplitExpenseModal, exchange rates) that would need real API integration
- Receipt upload is simulated with placeholder URLs — would need Firebase Storage integration for production