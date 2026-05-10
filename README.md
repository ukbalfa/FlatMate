<div align="center">

<br/>

# 🏠 FlatMate

### *The all-in-one command centre for shared living.*

<br/>

[![Version](https://img.shields.io/badge/version-0.1.1-F97316?style=for-the-badge&logo=github)](https://github.com/ukbalfa/FlatMate/releases)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=000)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=fff)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=000)](https://firebase.google.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](./LICENSE)

<br/>

> **FlatMate** eliminates awkward conversations about money and chores by giving every roommate  
> a single, real-time dashboard — accessible from any device, anywhere.

<br/>

[**🚀 Get Started**](#-getting-started) · [**✨ Features**](#-features) · [**🏗️ Architecture**](#%EF%B8%8F-architecture) · [**⚙️ Configuration**](#%EF%B8%8F-environment-variables)

<br/>

---

</div>

## 📖 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#%EF%B8%8F-tech-stack)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Variables](#%EF%B8%8F-environment-variables)
- [🔥 Firebase Setup](#-firebase-setup)
- [📜 Available Scripts](#-available-scripts)

---

## ✨ Features

<div align="center">

| 🏠 &nbsp;**Dashboard** | 💸 &nbsp;**Expenses** | 🧹 &nbsp;**Cleaning** |
|:---|:---|:---|
| Real-time metrics, rent countdown, monthly spend overview, exchange rate ticker, pinned announcements, and activity feed. Modern dark bento grid UI with glassmorphic cards. | Add, categorise, and split shared costs. **Recurring expenses** auto-generate monthly. Receipt uploads, paginated real-time list, analytics dashboard, and budget tracking per category. | Admin-curated weekly chore list. Any roommate can mark tasks done — auto-resets each week. |

| ✅ &nbsp;**Tasks** | 👥 &nbsp;**Roommates** | 💱 &nbsp;**Rates** |
|:---|:---|:---|
| Shared to-do list with due dates, assignees, and smart **Upcoming / Today / Overdue** badges. Task assignment notifications. | Profile cards with Telegram & Instagram links, color picker. Admins can create, edit, and remove accounts. Flat invite code system. | Live USD / UZS / EUR rates from `open.er-api.com`, refreshed every 10 minutes with a built-in converter and favorites. |

| ⚖️ &nbsp;**Balances** | 🔒 &nbsp;**Data Isolation** | 📢 &nbsp;**Announcements** |
|:---|:---|:---|
| Crystal-clear overview of who owes what across all shared expenses. Record settlements with timestamped ledger. | Full flat-level isolation via Firestore security rules and `flatId` query filters — roommates only see their own flat's data. | Pin important notices. Anyone can post — admins can pin/delete. Color-coded categories. |

| 🌐 &nbsp;**i18n** | 🎨 &nbsp;**Dark-only UI** | 📱 &nbsp;**Responsive** |
|:---|:---|:---|
| Full 3-language support: English, Русский, O'zbek. Language persisted to localStorage. | Rich dark theme with orange accent (`#F97316`), glassmorphism, glow effects, and noise texture overlay. | Desktop sidebar + mobile hamburger menu — works great on every screen size. |

</div>

---

## 🛠️ Tech Stack

### Core

| Package | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | `16.2.2` | App Router, Turbopack, Server Actions |
| [React](https://react.dev) | `19.2.4` | UI library |
| [TypeScript](https://www.typescriptlang.org) | `5` | Type safety (strict mode) |

### UI & Styling

| Package | Version | Purpose |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com) | `4` | Utility-first CSS with `@theme` tokens in `globals.css` |
| [Framer Motion](https://www.framer.com/motion/) | `12` | Page transitions, card animations, sidebar |
| [Lucide React](https://lucide.dev) | `1.7.0` | Icon library |
| [Sonner](https://sonner.emilkowal.ski/) | `2` | Toast notifications |

### Backend & Data

| Package | Version | Purpose |
|---|---|---|
| [Firebase](https://firebase.google.com) | `12` | Firestore client SDK — real-time via `onSnapshot` |
| [firebase-admin](https://firebase.google.com/docs/admin/setup) | `13` | Server Actions (privileged operations) |
| [open.er-api.com](https://open.er-api.com) | — | Live exchange rates, polled every 10 min |

### Testing

| Package | Version | Purpose |
|---|---|---|
| [Jest](https://jestjs.io) | `29` | Unit & component testing |
| [@testing-library/react](https://testing-library.com) | `16` | React component testing |

### Dev Tooling

| Tool | Purpose |
|---|---|
| [Python 3](https://python.org) | Agent skill scripts (`.agents/skills/`) for UI/UX design generation & webapp testing automation |
| [Playwright](https://playwright.dev) | Browser automation used by webapp-testing skill scripts |

---

## 🏗️ Architecture

### Data Flow

```
Browser (React Client Components)
    │
    ├── 🔥 Firebase Firestore ─── real-time (onSnapshot) / one-time (getDocs)
    │        collections:  users · expenses · tasks · cleaning
    │                      settlements · announcements · notifications
    │                      recurringExpenses · flats
    │
    ├── ⚡ Server Actions (firebase-admin) ─── privileged ops (e.g. delete user)
    │
    └── 🌐 open.er-api.com ─── live exchange rates, polled every 10 min
                                falls back to localStorage cache on failure
```

### Auth Model

```
1. User signs in via Firebase Auth (email/password, Google, or Telegram)
        │
        ▼
2. onAuthStateChanged triggers Firestore lookup by UID
        │
        ▼
3. User profile cached in localStorage under key "user"
        │
        ▼
4. Dashboard layout reads cached profile instantly on refresh
   → redirects to /login if no session found
        │
        ▼
5. Role-based UI: admin vs. roommate (from `role` field)
```

### Theme

- **Dark-only** — app uses a forced dark palette (`#050505`–`#0A0A0A` backgrounds, white text)
- **Brand accent** `#F97316` — orange glow effects, active states, buttons
- **Custom `ThemeContext`** — `ClientThemeProvider` in root layout; no theme toggle
- **Framer Motion** — page transitions, staggered list entries, card hover effects, sidebar slide-in
- **CSS helpers** — `animate-fade-in`, `animate-slide-down`, `stagger-1`–`stagger-4` in `globals.css`
- **Noise overlay** — subtle grain texture via SVG on layout background

---

## 📁 Project Structure

```
flatmate-dashboard/
├── app/
│   ├── layout.tsx                  # Root layout — Sora/DM Sans fonts + Providers
│   ├── providers.tsx               # Auth → Notifications → I18n + Sonner toaster
│   ├── globals.css                 # Tailwind v4 @theme tokens, fm-* helper classes
│   ├── page.tsx                    # Public landing page (redirects to /dashboard if authed)
│   ├── not-found.tsx               # 404 page
│   ├── login/
│   │   └── page.tsx                # Login + first-admin bootstrap flow
│   ├── dashboard/
│   │   ├── layout.tsx              # Sidebar + route guard + FlatConnectionModal
│   │   ├── page.tsx                # Home — metrics, announcements, activity feed
│   │   ├── expenses/               # Expenses, recurring expenses, splits, receipts
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── ExpenseCard.tsx
│   │   │       ├── AnalyticsDashboard.tsx
│   │   │       ├── BudgetTracker.tsx
│   │   │       ├── ReceiptUpload.tsx
│   │   │       └── SplitExpenseModal.tsx
│   │   ├── rates/                  # Exchange rates, converter, charts
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── ExchangeRateCard.tsx
│   │   │       ├── RateChart.tsx
│   │   │       ├── ConverterForm.tsx
│   │   │       ├── FavoritesBar.tsx
│   │   │       └── SourceToggle.tsx
│   │   ├── balances/page.tsx       # Who-owes-whom + settlement recording
│   │   ├── cleaning/page.tsx       # Weekly chore schedule
│   │   ├── tasks/page.tsx          # Task manager with due-date badges
│   │   ├── roommates/page.tsx      # Roommate profile cards + add/edit/delete
│   │   ├── settings/page.tsx       # Profile, password, notifications, danger zone
│   │   └── announcements/page.tsx  # Pinned announcements board
│   ├── actions/
│   │   └── deleteRoommate.ts       # Server Action (firebase-admin)
│   ├── components/                 # Shared UI components (app-specific)
│   │   ├── Avatar.tsx              # Image + initials fallback
│   │   ├── ConfirmModal.tsx        # Delete/confirm dialog
│   │   ├── EmptyState.tsx          # Placeholder for empty lists
│   │   ├── ErrorBoundary.tsx       # React error boundary
│   │   ├── FlatConnectionModal.tsx # Create/join flat flow
│   │   ├── LanguageSwitcher.tsx    # en / ru / uz toggle
│   │   ├── NotificationsDropdown.tsx
│   │   ├── RentCountdown.tsx       # Rent due date tracker
│   │   ├── Skeleton.tsx            # Loading skeleton
│   │   └── Spinner.tsx             # Inline spinner
│   └── landing/                    # Landing page sections
│       ├── HeroSection.tsx
│       ├── FeaturesSection.tsx
│       ├── TestimonialsSection.tsx
│       ├── MarqueeSection.tsx
│       ├── FooterSection.tsx
│       └── SectionDivider.tsx
├── components/                     # Shared components (root-level)
│   ├── ui/PrimaryButton.tsx        # Reusable CTA button
│   ├── ClientThemeProvider.tsx     # Theme context provider
│   ├── LangSync.tsx                # Language attribute sync
│   └── NoiseOverlay.tsx            # Grain texture background
├── context/
│   ├── AuthContext.tsx              # Auth state + userProfile + localStorage cache
│   ├── I18nContext.tsx              # i18n (en, ru, uz)
│   └── NotificationsContext.tsx     # Notification state + toast system
├── lib/
│   ├── firebase.ts                  # Firebase client SDK init
│   ├── firebase-admin.ts           # Firebase Admin SDK init
│   ├── motion.ts                   # usePrefersReducedMotion hook
│   ├── errorLogger.ts              # Structured error logging helper
│   ├── export.ts                   # Data export utilities
│   ├── recurringExpensesEngine.ts  # Auto-generate recurring expenses
│   ├── types.ts                    # TypeScript interfaces
│   └── utils.ts                    # Shared helpers (formatCurrency, formatTimeAgo, etc.)
├── public/
│   └── noise.svg                  # Reusable grain texture
├── __tests__/                      # Jest test suite (103 tests)
│   ├── utils.test.ts
│   ├── Skeleton.test.tsx
│   ├── ErrorBoundary.test.tsx
│   └── PrimaryButton.test.tsx
├── firestore.rules                 # Firestore security rules
├── firestore.indexes.json          # Composite indexes for flatId queries
├── firebase.json                   # Firebase project config
├── next.config.ts                  # Next.js config (Turbopack)
├── tsconfig.json                   # TypeScript config (strict)
├── eslint.config.mjs               # ESLint flat config
└── .env.local                      # 🔒 Firebase credentials (never committed)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or later
- A **Firebase** project with Firestore enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ukbalfa/FlatMate.git
cd flatmate-dashboard

# 2. Install dependencies
npm install

# 3. Create the environment file and fill in your Firebase credentials
touch .env.local

# 4. Deploy Firestore security rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# 5. Start the development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> **First run?** The login page guides you through bootstrapping your first admin account. No manual Firestore seeding needed.

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

```env
# Firebase (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (server-side — only needed for deleteRoommate action)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Telegram (required for Telegram login)
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_BOT_TOKEN=your_bot_token
```

> ⚠️ **Never commit `.env.local` to version control.** It is in `.gitignore` by default.

---

## 🔥 Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Cloud Firestore** in production mode.
3. **Enable Firebase Authentication** providers you want to use:
   - Email/Password
   - Google (optional)
   - Telegram (optional — requires a bot from [@BotFather](https://t.me/botfather))
4. **Deploy the included security rules and indexes:**
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
   > Rules enforce **flat-level isolation** via `flatId`: users can only read/write documents belonging to their flat. See `firestore.rules` for details.
5. Copy your Firebase web app credentials into `.env.local`.

> Admin accounts are bootstrapped through the login page on first run — no manual Firestore seeding required.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with **Turbopack** |
| `npm run build` | Create an optimised production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint across the entire codebase |
| `npm run test` | Run Jest test suite (103 tests) |

---

<div align="center">

Built with ❤️ for shared living &nbsp;·&nbsp; **v0.1.1**

</div>
