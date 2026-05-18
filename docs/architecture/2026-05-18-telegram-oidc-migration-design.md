# Telegram Login OIDC Migration Design

**Date:** 2026-05-18
**Topic:** Replace legacy Telegram widget with new OIDC-based login flow

## Problem

The current Telegram login uses the deprecated iframe-based widget (`telegram-widget.js?22`), which:
- Loads duplicate scripts on every click
- Has no consent check or rate limiting
- Uses a 30-second loading timeout hack
- Provides no feedback when popup is blocked
- Is officially archived by Telegram

## Solution: Migrate to Telegram's OIDC Login Flow

### Architecture

**Client flow:**
1. Load `https://telegram.org/js/telegram-login.js` once
2. Call `Telegram.Login.init({ client_id }, callback)`
3. User approves in Telegram popup → callback receives `{ id_token, user }`
4. Send `id_token` to `/api/auth/telegram`
5. Server verifies JWT, creates/finds user, returns Firebase custom token
6. Client signs into Firebase → dashboard

**Server flow:**
1. Receive `id_token` from client
2. Fetch Telegram's JWKS from `https://oauth.telegram.org/.well-known/jwks.json`
3. Verify JWT: signature, `iss` = `https://oauth.telegram.org`, `aud` = Client ID, not expired
4. Extract claims: `id` (telegramId), `name`, `preferred_username`, `picture`
5. Find existing user by `telegramId` in Firestore, or create new
6. Create Firebase custom token, return to client

### Files Changed

| File | Action |
|------|--------|
| `app/login/page.tsx` | Replace `handleTelegramClick` with `Telegram.Login.init()` flow |
| `app/api/auth/telegram/route.ts` | Replace hash verification with JWT/JWKS verification |
| `context/I18nContext.tsx` | No changes (existing keys reused) |
| `.env.local` | Add `NEXT_PUBLIC_TELEGRAM_CLIENT_ID` |

### New Env Vars

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_TELEGRAM_CLIENT_ID` | Client | BotFather Client ID for Telegram.Login SDK |
| `TELEGRAM_BOT_TOKEN` | Server | Keep existing (may be used elsewhere) |

### What Gets Removed

- `handleTelegramClick` script injection with `setTimeout`/`iframe` hacks
- `verifyTelegramHash` function (replaced by JWT verification)
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` env var usage (no longer needed)
- Legacy `data-telegram-login` attributes

### Security

- JWT verification uses Telegram's public JWKS (cryptographic proof)
- Validates `iss`, `aud`, `exp` claims
- Server-side user creation still uses Firebase Admin SDK
- Privacy consent enforced before opening Telegram popup
- Rate limiting applied (same as email sign-in)

### Error Handling

| Scenario | User Message |
|----------|-------------|
| Telegram popup blocked | "Popup was blocked. Please allow popups and try again." |
| Telegram auth failed | "Telegram authentication failed" |
| JWT verification failed | "Telegram authentication failed" |
| Rate limited | "Too many attempts. Try again in X seconds" |
| Consent not accepted | "Please accept the privacy policy and terms of service" |
