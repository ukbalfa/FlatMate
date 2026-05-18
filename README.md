<div align="center">
  <h1>FlatMate</h1>
  <p><strong>The modern command center for shared living.</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=000)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=fff)](https://tailwindcss.com)
  [![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=000)](https://firebase.google.com)
  [![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](./LICENSE)
</div>

<br/>

**FlatMate** is a production-ready co-living management platform designed to eliminate the friction of shared living. It provides a real-time, centralized dashboard for tracking shared expenses, managing chores, and resolving balances transparently. Built with a focus on modern UI/UX, security, and real-time synchronization.

---

## Architecture Overview

FlatMate is engineered for performance and real-time data consistency, leveraging the modern React ecosystem:

- **Frontend**: Next.js 16 (App Router) combined with React 19. Designed strictly with Server and Client components separating rendering logic from interactive state.
- **Styling**: Tailwind CSS v4 featuring a strictly enforced dark-mode glassmorphic design system. Animations powered by Framer Motion.
- **Backend & Database**: Firebase Firestore handles real-time data synchronization (`onSnapshot`), while Firebase Admin SDK runs securely within Next.js Server Actions for privileged operations.
- **Security**: Strict Firestore Security Rules ensure absolute tenant isolation—users can only query and mutate data strictly associated with their authorized `flatId`.
- **State Management**: React Context layers orchestrate global state (`Auth`, `i18n`, `Notifications`), aggressively caching payload data to `localStorage` for instant apparent load times.

## Core Features

- **Real-Time Financial Ledger**: Track, categorize, and split shared expenses instantly. Supports recurring monthly expenses, receipt attachments, and budget analytics per category.
- **Balance Settlement Engine**: An automated debt calculation matrix that shows exactly who owes whom, complete with a timestamped settlement history.
- **Task & Chore Orchestration**: Admin-curated weekly rotating cleaning schedules and shared household to-do lists featuring assignment tracking and overdue detection.
- **Live Exchange Rates**: Built-in multi-currency support polling `open.er-api.com` every 10 minutes, with a dedicated caching layer.
- **Multi-Tenant Security**: Role-based access control (Admin vs. Roommate) isolated entirely by secure Firestore database rules.
- **Internationalization (i18n)**: Native triple-language support (English, Russian, Uzbek).

## Tech Stack

| Category | Technologies |
|---|---|
| **Framework** | Next.js 16, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS v4, Framer Motion, Lucide React, Sonner |
| **Database & Auth** | Firebase 12, Firebase Admin 13 |
| **Data Visualization** | Recharts, React Circular Progressbar |
| **Testing** | Jest 29, React Testing Library |

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore and Authentication enabled.

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ukbalfa/FlatMate.git
   cd FlatMate
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` (or create a new `.env.local`) and populate your credentials. Refer to the [Configuration](#configuration) section below.

4. **Deploy Firestore Rules & Indexes:**
   Ensure database security and querying performance by deploying the included rules and composite indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000`. The login interface will guide you through bootstrapping the initial administrator account.

## Configuration

Required variables for `.env.local`:

```env
# Client-side Firebase Init
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server-side Firebase Admin (Required for Server Actions)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Security (hCaptcha)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_site_key
HCAPTCHA_SECRET_KEY=your_secret_key

# Optional: Telegram Login (OIDC)
NEXT_PUBLIC_TELEGRAM_CLIENT_ID=your_telegram_client_id
```

## Available Scripts

- `npm run dev`: Boot the Next.js development server (Turbopack enabled).
- `npm run build`: Generate an optimized production build.
- `npm run start`: Serve the compiled production application.
- `npm run lint`: Execute ESLint across the codebase.
- `npm run test`: Execute the Jest testing suite.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
