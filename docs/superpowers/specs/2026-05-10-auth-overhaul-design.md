# Auth Overhaul — Google, Telegram, Flat Connection

## Overview

Add Google OAuth and Telegram Login Widget to FlatMate alongside the existing email/password auth. Introduce a flat connection flow so new users can create or join a flat without manual Firestore edits. Remove the hidden developer admin toggle from the login page.

---

## 1. Login Page Layout

**Approved option: A — Stacked Buttons**

Three auth methods stacked vertically:

1. **Continue with Google** — prominent branded button
2. **Continue with Telegram** — Telegram-branded button
3. **Divider** with "or" text
4. **Email form** — email + password fields + Sign In button

The hidden "Developer? Initialize First Admin" toggle is removed.

---

## 2. Google Auth

**Provider:** Firebase `GoogleAuthProvider` via `signInWithPopup`.

**First-time flow:**
- Reads `displayName`, `email`, `photoURL` from Google profile
- Creates Firestore document `users/{uid}` with:
  - `username` → Google email
  - `name` → Google displayName
  - `role` → `'roommate'`
  - `joinedAt` → ISO date
  - `avatar` → Google `photoURL` (stored as-is, used for profile card display)
- No `flatId` set → user will be prompted to join/create a flat

**Existing account conflict:**
- Firebase throws `auth/account-exists-with-different-credential`
- Show modal: *"An account with [email] already exists. Sign in with your password to connect them."*
- User enters password → `linkWithCredential` merges Google into the existing account
- User declines → fall back to email sign-in form

---

## 3. Telegram Auth

**Provider:** Telegram Login Widget (custom integration).

**Prerequisites:**
- Telegram Bot created via @BotFather → bot token
- Bot token configured as `TELEGRAM_BOT_TOKEN` env var in `.env.local`

**Client-side flow:**
1. User clicks "Continue with Telegram"
2. Telegram Login Widget popup opens (configured via `<script>` tag with `data-telegram-login="{bot_username}"`)
3. Widget calls callback with: `{ id, first_name, last_name, username, photo_url, auth_date, hash }`
4. Client sends this data to `POST /api/auth/telegram`

**Server-side flow (`app/api/auth/telegram/route.ts`):**
1. Verify the hash using HMAC-SHA256 with the bot token
2. Check `auth_date` is within 5 minutes (replay prevention)
3. Look up or create a Firebase Auth user by Telegram ID (stored in Firestore `users/{uid}/telegramId`)
4. Mint a Firebase custom auth token via Admin SDK (`firebase-admin`)
5. Return the custom token to the client

**Client-side after token received:**
1. Call `signInWithCustomToken(customToken)` from Firebase Auth
2. Normal auth flow proceeds (AuthContext picks it up)

**First-time auto-create Firestore profile:**
- `username` → Telegram username (or `tg_{id}` if no username)
- `name` → Telegram first_name + last_name
- `role` → `'roommate'`
- `joinedAt` → ISO date
- `avatar` → Telegram photo_url

---

## 4. Account Linking

Handled at two points:

| Scenario | Handling |
|----------|----------|
| Google email conflicts with existing email/password account | Catch `auth/account-exists-with-different-credential`, show linking modal with password prompt |
| Telegram user already linked to a different account | Check Firestore for telegramId before creating; if exists, return existing custom token instead |

No email-based "link Telegram to this account" flow needed — Telegram doesn't expose email, so conflicts are impossible by email. Telegram ID is the unique key.

---

## 5. Flat Connection Flow

**Trigger:** After any successful login, check if `userProfile.flatId` is empty.

**Modal (skippable):** Two tabs/options:

| Option | Action |
|--------|--------|
| **Create a Flat** | Generates a unique 6-character invite code (e.g. `A3X9K2`). Creates a document in `flats/{code}`. This code **is** the `flatId`. Assigns `flatId` to current user, sets their role to `admin`. |
| **Join a Flat** | User enters a 6-character invite code. Server looks up `flats/{code}`. If found, assigns that code as the user's `flatId`. |
| **Skip** | Modal dismissed. User goes to dashboard with no flat. |

**Invite code format:** 6 alphanumeric uppercase characters (e.g., `A3X9K2`), used as both the document ID in `flats/` collection and the `flatId` on user/expense/task documents.

**Dashboard empty state:** When `flatId` is null, all data-dependent sections show:
- *"You're not in a flat yet. [Set up your flat →]"* — banner at top of dashboard
- Empty states everywhere: *"Join a flat to see expenses"*, *"No flat = no tasks"*, etc.

**Roommates page:** Added option for admin to view/re-share the invite code for their flat.

---

## 6. Files Changed

| File | Change |
|------|--------|
| `app/login/page.tsx` | Redesign layout (Option A), add Google + Telegram buttons, remove dev toggle |
| `app/api/auth/telegram/route.ts` | **New** — POST handler: verify hash, mint custom token |
| `lib/firebase.ts` | Export `adminAuth` for custom token minting (or init in API route) |
| `context/AuthContext.tsx` | Add flat connection check after login, expose `flatId` state |
| `app/components/FlatConnectionModal.tsx` | **New** — Create/Join/Skip modal component |
| `app/dashboard/page.tsx` | Add flatless banner when `flatId` is null |
| `app/dashboard/roommates/page.tsx` | Show invite code for admin to share |
| `lib/types.ts` | Add `Flat` type |
| `.env.local.example` | Add `TELEGRAM_BOT_TOKEN` |
| `firestore.rules` | Add rule for `flats/` collection — authenticated create, flat-member read |

---

## 7. Auth Flow Diagram

```
Login Page
  ├── Google button → Google popup → Firebase Auth → AuthContext picks up
  │                                      ↓
  │                            First time? → Create Firestore profile
  │                                      ↓
  ├── Telegram button → Telegram Widget → POST /api/auth/telegram
  │                                      ↓
  │                            Custom token → signInWithCustomToken
  │                                      ↓
  │                            First time? → Create Firestore profile
  │                                      ↓
  └── Email form → signInWithEmailAndPassword
                                     ↓
                            All paths converge:
                            AuthContext.onAuthStateChanged
                                     ↓
                            flatId exists?
                            ├── Yes → Dashboard
                            └── No → FlatConnectionModal
                                     ├── Create flat → flatId assigned → Dashboard
                                     ├── Join flat → flatId assigned → Dashboard
                                     └── Skip → Dashboard (banner shown)
```

---

## 8. Security Considerations

- Telegram hash verification: HMAC-SHA256 with bot token, never exposing the token to the client
- Custom token minting: only in server-side API route using firebase-admin, never in client code
- `auth_date` replay protection: reject tokens older than 5 minutes
- Firestore rules: `flats/{flatId}` — anyone authenticated can create, only flat members can read
- Google popup: handled entirely by Firebase SDK — no custom credential handling

---

## 9. Cost Summary

| Item | Cost |
|------|------|
| Firebase Auth (Google + Email) | Free |
| Telegram Bot API | Free |
| Firebase Admin SDK (custom tokens) | Free (included in Spark plan) |
| Vercel/Next.js API route | Free on Vercel Hobby |
| Apple Developer Program | Skipped ($0) |

**Total: $0**
