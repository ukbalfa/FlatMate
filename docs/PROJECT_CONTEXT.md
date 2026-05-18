# FlatMate — Project Context Document

---

## 1. Executive Summary & Purpose

**FlatMate** is a co-living management web application designed for roommates sharing an apartment. It provides a centralized dashboard for managing shared household responsibilities including:

- **Expense tracking & splitting** — Log shared costs (rent, groceries, utilities, etc.), split them among roommates, and track who owes whom.
- **Chore/cleaning schedule** — Weekly rotating cleaning task assignments with day-of-week tracking.
- **Task management** — Shared to-do lists with due dates, assignments, and completion tracking.
- **Balance settlement** — Record payments between roommates to settle debts; see a "who owes whom" view.
- **Live exchange rates** — Polled currency rates (USD/UZS/EUR) updated every 10 minutes via `open.er-api.com`.
- **Announcements** — A shared bulletin board for household notices.
- **Roommate profiles** — Contact info (phone, Telegram, Instagram), roles (admin/roommate), and profile colors.

**Target audience**: Roommates living together in shared apartments, primarily in Uzbekistan (Tashkent-focused, UZS currency). Supports 3 languages: English, Russian, and Uzbek.

**Primary user flow**: A designated admin bootstraps the household on first login → adds roommates via email/password → all roommates log in to track expenses, chores, and balances.

---

## 2. Tech Stack & Tooling

### Core Framework
| Tool | Version | Purpose |
|------|---------|---------|
| **Next.js** | 16.2.2 | Full-stack React framework (App Router) |
| **React** | 19.2.4 | UI library |
| **TypeScript** | ^5 | Static type checking |

### Styling & UI
| Tool | Version | Purpose |
|------|---------|---------|
| **Tailwind CSS** | ^4 | Utility-first CSS framework |
| **@mantine/core** | ^9.1.1 | UI component library |
| **Framer Motion** | ^12.38.0 | Animation library |
| **lucide-react** | ^1.14.0 | Icon set |
| **next-themes** | ^0.4.6 | Dark/light theme management |
| **Sonner** | ^2.0.7 | Toast notification library |

### Data & Auth
| Tool | Version | Purpose |
|------|---------|---------|
| **Firebase (client SDK)** | ^12.11.0 | Authentication, real-time Firestore |
| **firebase-admin** | ^13.7.0 | Server-side privileged operations |
| **recharts** | ^3.8.1 | Data charting/visualization |
| **react-circular-progressbar** | ^2.2.0 | Circular progress indicators |
| **react-dropzone** | ^15.0.0 | File upload (receipts) |

### Build & Test
| Tool | Version | Purpose |
|------|---------|---------|
| **ESLint** | ^9 | Code linting |
| **Jest** | ^30.3.0 | Unit/integration testing |
| **ts-jest** | ^29.4.9 | TypeScript Jest transformer |
| **@testing-library/react** | ^16.3.2 | React component testing |

### Key config files
- `tsconfig.json` — TypeScript configuration
- `tailwind.config.js` — Tailwind CSS theme/tokens
- `eslint.config.mjs` — ESLint rules
- `jest.config.ts` — Jest configuration
- `firebase.json` — Firebase hosting config
- `firestore.rules` — Firestore security rules
- `firestore.indexes.json` — Firestore composite indexes

---

## 3. Project Structure & Architecture

### Directory Tree
```
/ (project root)
├── app/                              # Next.js App Router routes
│   ├── actions/                       # Server Actions (firebase-admin)
│   │   └── deleteRoommate.ts         # Delete roommate (server-side)
│   ├── components/                    # Shared UI components
│   │   ├── ConfirmModal.tsx          # Confirmation dialog
│   │   ├── EmptyState.tsx            # Empty state placeholder
│   │   ├── ErrorBoundary.tsx         # React error boundary
│   │   ├── LanguageSwitcher.tsx      # Language toggle
│   │   ├── NotificationsDropdown.tsx # Notification bell dropdown
│   │   ├── RentCountdown.tsx         # Rent due countdown
│   │   ├── Skeleton.tsx             # Loading skeleton placeholders
│   │   └── Spinner.tsx              # Loading spinner
│   ├── dashboard/                    # Protected dashboard routes
│   │   ├── announcements/            # Announcement board
│   │   ├── balances/                 # Expense balances & settlements
│   │   ├── cleaning/                 # Cleaning schedule
│   │   ├── expenses/                 # Expense tracking (with analytics)
│   │   ├── rates/                    # Exchange rate converter
│   │   ├── roommates/                # Roommate management
│   │   ├── settings/                 # User profile & preferences
│   │   ├── tasks/                    # Task management
│   │   ├── layout.tsx               # Dashboard sidebar + topbar shell
│   │   └── page.tsx                  # Dashboard home page
│   ├── landing/                      # Marketing landing page
│   │   ├── FeaturesSection.tsx
│   │   ├── FooterSection.tsx
│   │   ├── HeroSection.tsx
│   │   ├── MarqueeSection.tsx
│   │   ├── SectionDivider.tsx
│   │   └── TestimonialsSection.tsx
│   ├── login/                        # Auth landing + login page
│   │   └── page.tsx
│   ├── globals.css                   # Global styles & CSS variables
│   ├── layout.tsx                    # Root HTML layout (server component)
│   ├── page.tsx                      # Landing/home page
│   ├── not-found.tsx                 # 404 page
│   └── providers.tsx                 # React context provider composition
├── components/                       # Shared non-route components
│   ├── ui/                           # Reusable UI primitives
│   │   └── PrimaryButton.tsx
│   ├── ClientThemeProvider.tsx       # Bridges ThemeContext to client
│   ├── LangSync.tsx                  # Syncs HTML lang attribute
│   └── NoiseOverlay.tsx             # Background noise texture
├── constants/                        # Static constants
│   ├── animations.ts
│   └── theme.ts                      # Color/shadow/transition tokens
├── context/                          # React contexts
│   ├── AuthContext.tsx               # Firebase Auth + user profile
│   ├── I18nContext.tsx               # i18n (en/ru/uz)
│   ├── NotificationsContext.tsx     # Notification state
│   └── ThemeContext.tsx             # Dark/light theme
├── lib/                              # Utility modules
│   ├── errorLogger.ts               # Centralized error logging
│   ├── export.ts                    # CSV export & yearly summaries
│   ├── firebase.ts                  # Firebase client SDK init
│   ├── motion.ts                    # Framer Motion reduced-motion helper
│   ├── recurringExpensesEngine.ts  # Recurring expense generation
│   └── utils.ts                     # Shared helpers (cn, getMonday, etc.)
├── __tests__/                        # Jest tests
│   ├── ConfirmModal.test.tsx
│   ├── EmptyState.test.tsx
│   ├── I18nContext.test.tsx
│   ├── Spinner.test.tsx
│   ├── export.test.ts
│   ├── recurringExpensesEngine.test.ts
│   └── utils.test.ts
├── .env.local                        # Environment variables (gitignored)
├── .github/                          # CI workflows
├── public/                           # Static assets
├── docs/                             # Documentation
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

### Architecture Pattern
**Next.js App Router (Server + Client Components)** with a **feature-based route structure**. The app follows a layered architecture:

1. **Presentation layer**: React client components (`'use client'`) organized by feature route (dashboard, landing, login).
2. **State management**: React Context providers for auth, i18n, notifications, and theme. Firestore real-time subscriptions via `onSnapshot` for reactive data.
3. **Data access**: Direct Firebase SDK usage (client-side for reads, `firebase-admin` server actions for privileged writes).
4. **Business logic**: Shared utility modules in `lib/` (recurring expense engine, CSV export, date helpers).

---

## 4. Core Business Logic & Entry Points

### Entry Points

1. **`app/layout.tsx`** — Root layout. Loads Google Fonts, metadata/SEO, structured data, theme color. Wraps children with `ClientThemeProvider` → `Providers` (Auth → Notifications → I18n).

2. **`app/page.tsx`** — Public landing page home.

3. **`app/login/page.tsx`** — Login page with dual-mode: sign in existing user OR bootstrap first admin account. Redirects to `/dashboard` on auth success.

4. **`app/dashboard/layout.tsx`** — Route guard for all dashboard pages. Checks auth state; redirects unauthenticated users to `/login`. Renders sidebar navigation + top bar.

5. **`app/dashboard/page.tsx`** — Dashboard home. Shows 4 stat cards (monthly expenses, tasks, cleaning, roommates count), quick action shortcuts, activity feed, rent countdown, monthly overview.

### Critical Feature Modules

6. **`app/actions/deleteRoommate.ts`** — Server Action. Verifies admin identity via Firebase Admin token, checks same-flat membership, deletes both Firebase Auth user and Firestore document, revalidates cache.

7. **`app/dashboard/expenses/page.tsx`** — Full expense management: CRUD operations, category filtering, month selection, recurring expense awareness, receipt upload (stub), split-with modal, analytics charts, budget trackers.

8. **`app/dashboard/balances/page.tsx`** — Balance sheet: calculates per-person share, identifies debtors/creditors, settlement history, record new settlements (with confirmation modal), admin deletion of settlements.

9. **`app/dashboard/roommates/page.tsx`** — Admin-managed roommate CRUD. Creates Firebase Auth user + Firestore profile via secondary Firebase app instance. Edit profiles, delete roommates (server-action-verified).

10. **`app/dashboard/settings/page.tsx`** — User settings: profile editing (name, surname, occupation, contact links, avatar color), password change (with re-authentication), email verification, notification preferences toggle.

11. **`lib/recurringExpensesEngine.ts`** — Background engine. Scans all recurring expenses for a flat, generates individual expense entries for missed due dates (daily/weekly/monthly/yearly patterns), commits in batches of 500.

12. **`lib/export.ts`** — Data export: converts expense array to downloadable CSV, generates yearly summaries with monthly totals broken down by category.

### Context Modules (State Management)

13. **`context/AuthContext.tsx`** — `onAuthStateChanged` listener → fetches user profile from `users` Firestore collection → provides `{ user, userProfile, loading }` via `useAuth()` hook.

14. **`context/NotificationsContext.tsx`** — Real-time Firestore listener on `notifications` collection filtered by userId. Provides `{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll, createNotification }`.

15. **`context/I18nContext.tsx`** — Translation lookup with parameterized interpolation. Languages: `en`, `ru`, `uz`. Provides `{ language, setLanguage, t }`.

16. **`context/ThemeContext.tsx`** — Persists dark/light theme to `localStorage` (key: `flatmate-theme`). Resolves from saved preference or `prefers-color-scheme` media query.

---

## 5. Data Models & State Management

### Firestore Collections

**`users`** — One document per user, keyed by Firebase Auth UID.
```typescript
interface UserProfile {
  uid: string;           // Firebase Auth UID
  username: string;      // Email used for login
  name?: string;
  surname?: string;
  flatId?: string;       // Identifier for the household
  role?: 'admin' | 'roommate';
  color?: string;        // Hex color for avatar (blue/amber/purple/teal/rose)
  occupation?: string;
  phone?: string;
  telegram?: string;     // Handle without @ prefix
  instagram?: string;    // Handle without @ prefix
  joinedAt?: string;     // ISO date
  notifications?: Record<string, boolean>;  // Per-user notification prefs
  emailVerified?: boolean;
}
```

**`expenses`** — Individual expense entries.
```typescript
interface Expense {
  id: string;
  flatId: string;
  amount: number;
  category: string;       // Rent | Groceries | Utilities | Internet | Misc
  paidBy: string;         // Username of payer
  date: string;           // ISO date YYYY-MM-DD
  description: string;
  note?: string;
  receiptUrl?: string;    // Placeholder only (no real upload)
  isRecurring?: boolean;
  splitWith?: Array<{ id: string; name: string; avatar: string }>;
  recurrencePattern?: 'monthly' | 'weekly' | 'yearly';
  recurrenceEndDate?: string;
  parentExpenseId?: string;
  createdAt: serverTimestamp;
}
```

**`recurringExpenses`** — Template for auto-generated expenses.
```typescript
interface RecurringExpense {
  flatId: string;
  amount: number;
  category: string;
  paidBy: string;
  startDate: string;      // ISO date
  endDate?: string | null;
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  note?: string;
  lastGeneratedDate?: string;  // Tracks which dates were already expanded
}
```

**`settlements`** — Recorded payments between roommates.
```typescript
interface Settlement {
  from: string;           // Username of payer
  to: string;             // Username of recipient
  amount: number;
  date: string;           // ISO date
  note?: string;
  status: 'pending' | 'completed';
  createdAt: string;
}
```

**`cleaning`** — Weekly cleaning task assignments.
```typescript
interface CleaningTask {
  task: string;
  assignedTo: string;     // Username
  dayOfWeek: string;      // Monday–Sunday
  weekStart: string;      // ISO date of Monday
  done: boolean;
}
```

**`tasks`** — Shared to-do list.
```typescript
interface Task {
  text: string;
  assignedTo: string;     // Username
  dueDate: string;        // ISO date
  done: boolean;
  createdBy: string;
}
```

**`notifications`** — User notification queue.
```typescript
interface Notification {
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'expense' | 'cleaning' | 'settlement' | 'system';
  read: boolean;
  createdAt: string;
  link?: string;
  data?: Record<string, unknown>;
}
```

### State Management Strategy
- **Firestore as single source of truth** — All data lives in Firestore; UI subscribes via `onSnapshot` for real-time updates.
- **React Context** for non-persistent UI state: auth, theme, language, notifications.
- **React local state** (`useState`) for ephemeral form data, loading states, modals.
- **No Redux/Zustand** — kept simple to stay aligned with the Next.js App Router mental model.

---

## 6. API & Routing

### Routing (All via Next.js App Router)

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing/marketing page |
| `/login` | Public | Login + first-admin-bootstrap |
| `/dashboard` | Auth required | Dashboard home |
| `/dashboard/expenses` | Auth required | Expense CRUD, analytics, budgets |
| `/dashboard/balances` | Auth required | Balance sheet, settlements |
| `/dashboard/cleaning` | Auth required | Weekly cleaning schedule |
| `/dashboard/tasks` | Auth required | Task management |
| `/dashboard/rates` | Auth required | Currency exchange rates |
| `/dashboard/roommates` | Auth required (admin actions gated) | Roommate management |
| `/dashboard/settings` | Auth required | Profile, security, notification prefs |
| `/dashboard/announcements` | Auth required | Announcement board |

### Communication Protocols
- **Firebase Firestore (real-time)** — Primary data layer. All CRUD via `onSnapshot` subscriptions and direct SDK calls.
- **Next.js Server Actions** (`'use server'`) — Used for privileged operations requiring Firebase Admin (e.g., `deleteRoommate.ts`).
- **Firebase Auth** — Email/password authentication. Login page uses `createUserWithEmailAndPassword` on a secondary Firebase app instance for roommate onboarding by admin.
- **External REST API (polled)** — Exchange rates from `open.er-api.com`, fetched client-side on the rates page.
- **No traditional REST/GraphQL API** — All data goes through Firestore directly from the client, except admin-only mutations.

### Dashboard Layout Navigation
Defined in `app/dashboard/layout.tsx`, the sidebar has 9 items:
```typescript
const navLinks = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/dashboard/rates", label: "nav.rates", icon: TrendingUp },
  { href: "/dashboard/expenses", label: "nav.expenses", icon: Receipt },
  { href: "/dashboard/balances", label: "nav.balances", icon: Wallet },
  { href: "/dashboard/cleaning", label: "nav.cleaning", icon: Sparkles },
  { href: "/dashboard/tasks", label: "nav.tasks", icon: CheckSquare },
  { href: "/dashboard/roommates", label: "nav.roommates", icon: Users },
  { href: "/dashboard/settings", label: "nav.settings", icon: Settings },
  { href: "/dashboard/announcements", label: "nav.announcements", icon: Megaphone },
];
```

### Auth Guard Flow
1. `app/layout.tsx` (root) → wraps with providers.
2. `app/dashboard/layout.tsx` → uses `useAuth()` hook; if `loading=false` and `user=null`, redirects to `/login`.
3. Has a 10-second timeout fallback (`authTimeout`) to handle stuck loading states.

---

## 7. Coding Conventions & Style

### General Patterns
- **Tailwind CSS v4** — All styling via atomic utility classes. No custom CSS files except `globals.css` for theme tokens and font definitions.
- **Dark mode first** — App defaults to dark mode (`bg-[#0A0A0A]`, `text-white`). Theme stored in `localStorage` under `flatmate-theme`.
- **Custom CSS classes defined in `globals.css`**: `.fm-card`, `.fm-btn-primary`, `.fm-input` (though these appear to be defined but not heavily used; the codebase mostly uses raw Tailwind).
- **Brand accent**: `#F97316` (orange), also referred to as `var(--color-accent)` and `gradient-citrus` in CSS.

### Component Conventions
- **All pages/layouts**: `'use client'` directive (except root `layout.tsx` which is a server component).
- **Default exports** named after the component/file: `export default function DashboardPage()`, `export default function ExpensesPage()`.
- **Props interfaces** defined inline at the top of the file or just before the component.
- **Framer Motion** used for: page transitions (`initial`/`animate`/`exit` on lists), hover effects, staggered animations (`delay` on sibling elements).
- **Responsive design**: Mobile-first with `lg:` breakpoints. Sidebar is `hidden lg:flex`. Grid layouts use `grid-cols-1 lg:grid-cols-2/3`.

### Naming Conventions
- **TypeScript interfaces**: `PascalCase` (e.g., `UserProfile`, `Expense`, `AuthContextType`).
- **React state variables**: `camelCase` (e.g., `userProfile`, `selectedMonth`, `showSettlementModal`).
- **Firestore collections**: `lowercase` plural (e.g., `users`, `expenses`, `settlements`, `recurringExpenses`, `cleaning`, `tasks`, `notifications`).
- **Firestore fields**: `camelCase` (e.g., `paidBy`, `createdAt`, `dueDate`, `isRecurring`, `lastGeneratedDate`).
- **Environment variables**: `NEXT_PUBLIC_FIREBASE_*` for client-side, `FIREBASE_*` for server-side (see Environment section).
- **Utility function**: `cn()` for conditional class merging (from `lib/utils.ts`).

### Data Format Conventions
- **Dates stored as**: ISO date strings `YYYY-MM-DD` (not full ISO timestamps, except `createdAt` which uses `serverTimestamp`).
- **Week start**: Calculated via `getMonday()` utility; cleaning tasks grouped by `weekStart`.
- **Currency**: UZS (Uzbekistani Som) is the primary currency; amounts stored as plain numbers, displayed with `.toLocaleString()` + `UZS` suffix.

### Error Handling
- **`logError()` utility** (`lib/errorLogger.ts`): Takes an error and optional context string. Currently just `console.error()` with a TODO to integrate Sentry.
- **Toast notifications** via Sonner: `toast.success()`, `toast.error()` for user-facing feedback.
- **Server Actions**: Return typed `{ success: boolean; error?: string }` objects for client consumption.
- **Try/catch blocks** in all async operations (Firestore writes, auth operations).

### Firebase Pattern
- Client SDK (`firebase`) for auth, real-time listeners, basic Firestore CRUD.
- `firebase-admin` for privileged operations (user deletion in `deleteRoommate.ts`).
- Secondary Firebase app instance (`'Secondary'`) used in `roommates/page.tsx` to create new roommate accounts without affecting the main auth session.
- Safe initialization with proxy fallbacks in `lib/firebase.ts` (throws clear error if Firebase not configured).

### State Management Pattern
- **Context providers** wrap the component tree: `AuthProvider` → `NotificationsProvider` → `I18nProvider`.
- **Each context** follows the pattern: `createContext` → custom `useXxx()` hook → `XxxProvider` component with `useState`/`useEffect`.
- **Firestore subscriptions**: `onSnapshot` with `query` → `useEffect` cleanup returns unsubscribe function.
- **Derived state**: `useMemo()` for computed values (e.g., `activityFeed`, `balances`, `debts`).

### Imports Convention
```
1. React/Next imports (useState, useEffect, etc.)
2. External library imports (firebase, framer-motion, lucide-react, sonner, etc.)
3. Relative imports (../../context/..., ../../../lib/...)
```

### File Structure Convention
- Each feature is a folder under `app/dashboard/` with `page.tsx` as the entry.
- Sub-components live in a `components/` subfolder within each feature.
- Shared components live in `app/components/` or `components/` at project root.

---

## 8. Environment & Setup

### Required Environment Variables

**Client-side (prefixed `NEXT_PUBLIC_`):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

**Server-side (used in Server Actions):**
```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Setup & Run Commands
```bash
# Install dependencies
npm install

# Run in development mode (with Turbopack)
npm run dev

# Lint code
npm run lint

# Run tests
npm run test

# Build for production
npm run build

# Start production server
npm run start
```

### Test Framework
- **Jest** with `ts-jest` and `@testing-library/react`
- 7 test files in `__tests__/`:
  - `ConfirmModal.test.tsx`, `EmptyState.test.tsx`, `Spinner.test.tsx` — Component tests
  - `I18nContext.test.tsx` — Context test
  - `export.test.ts` — CSV export test
  - `recurringExpensesEngine.test.ts` — Business logic test
  - `utils.test.ts` — Utility function test
- Config: `jest.config.ts`, `jest.setup.ts`

### Persisted State (localStorage)
- `flatmate-theme` — Dark/light theme choice
- `flatmate-language` — Selected language (referenced in code but not fully persisted in ThemeContext)
- `cached_rates` — Exchange rate cache (referenced in AGENTS.md)

---

## 9. Current State & Known Issues / TODOs

### Active TODOs

1. **`lib/errorLogger.ts:2`** — `// TODO: replace with Sentry or other monitoring` — Error logging is only `console.error()`. Production monitoring is not implemented.

2. **Receipt upload is faked** — In `app/dashboard/expenses/page.tsx`, the `handleUploadReceipt` function returns a placeholder URL. No actual Firebase Storage integration exists.

3. **Split expense feature is incomplete** — The `SplitExpenseModal` component exists and the UI works, but the split data (`splitWith` array) is stored with the expense and not actually used to calculate per-person shares or send notifications.

4. **Notification system is read-only** — The `NotificationsContext` can create and mark notifications as read, but no logic actually pushes notifications when events occur (new expense, task due, etc.). The `NotificationsProvider` is wired in but not actively triggered by mutations.

5. **Announcements page is empty** — `app/dashboard/announcements/page.tsx` contains only a placeholder. There's no Firestore collection support, CRUD, or data model for announcements in the visible code.

6. **Cleaning and Tasks pages not fully analyzed** — These pages exist as routes but were not deeply reviewed. They likely have similar patterns to expenses but may have unhandled edge cases.

7. **No pagination** — Firestore queries use `limit(50)` to `limit(200)` but there is no pagination UI or cursor-based loading for large datasets.

8. **Rate limiting / abuse prevention** — No rate limiting on expense creation, settlement creation, or other write operations. Server Actions only protect `deleteRoommate`.

### Known Code Quality Concerns

- **Inconsistent date handling** — Some dates come as ISO strings, others as Firestore Timestamp objects. The `roommates/page.tsx` has a `formatMonth()` function with multiple type-branching paths to handle this.

- **Missing `!` non-null assertions** — Several optional chaining patterns where data is assumed to exist (e.g., `userProfile?.uid` used in queries without guard).

- **Hardcoded budget limits** — In `expenses/page.tsx`, budget limits are hardcoded: `{ Rent: 500000, Groceries: 300000, Utilities: 200000, Internet: 150000, Misc: 100000 }`.

- **Mock roommate data** — In `expenses/page.tsx`, `roommates` data for the split modal is hardcoded with two mock entries instead of using real data from Firestore.

- **Duplicate type definitions** — `User`, `Expense`, and `CleaningTask` interfaces are defined locally in multiple page components rather than shared from a central type file.

- **No form validation beyond basics** — Password strength, email format, and required fields are the only validation; no schema-level validation (e.g., Zod).

### Areas of Active Development
Given the TODOs above, the most active areas of needed development are:
1. Replacing the TODO error logger with a real monitoring solution (Sentry)
2. Implementing Firebase Storage for receipt uploads
3. Building out the notifications trigger system
4. Completing the announcements feature
5. Adding pagination for data-heavy views