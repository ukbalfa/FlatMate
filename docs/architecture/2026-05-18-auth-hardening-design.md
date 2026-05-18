# Auth Hardening Design

**Date:** 2026-05-18
**Topic:** Login and Sign-up Security Hardening

## Problem

The current authentication flow (`app/login/page.tsx`) has several security and UX gaps:
- No email format validation (only checks non-empty)
- No email verification on sign-up — users go straight to dashboard
- No email verification check on sign-in — unverified accounts can log in
- Privacy consent checkbox not enforced (form uses `noValidate`)
- Inconsistent password requirements (6 chars sign-in, 8 chars sign-up)
- No bot protection or rate limiting

## Solution: Full Hardening (Approach C)

### 1. Email Validation & Password Strength

**Email regex validation** in both `handleEmailSignIn` and `handleEmailSignUp`:
```
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```
- Returns `login.errorValidEmail` translation if invalid
- Applied before any Firebase call

**Password minimum standardized to 8 characters** for both sign-in and sign-up.

**Password strength meter** on sign-up tab:
- Visual bar with 4 levels (Weak/Fair/Good/Strong)
- Criteria: length ≥ 8 (+1), contains digit (+1), contains special char (+1)
- Pure CSS implementation, no external library
- Colors: red → orange → yellow → green

**Privacy consent enforcement:**
- New `consentAccepted` state (boolean)
- Sign-up submit button disabled when unchecked
- Checkbox wired to state via `onChange`

### 2. Email Verification Gate

**Sign-up flow:**
1. `createUserWithEmailAndPassword` succeeds
2. Call `sendEmailVerification(firebaseUser)`
3. Redirect to new "Verify your email" page (`app/login/verify/page.tsx`)
4. Page shows: email address, "Check your inbox" message, resend button, "Back to sign in" link

**Sign-in flow:**
1. `signInWithEmailAndPassword` succeeds
2. Check `firebaseUser.emailVerified`
3. If false: show error "Please verify your email before signing in" + resend button
4. If true: redirect to dashboard

**Resend verification:**
- Calls `sendEmailVerification(user)`
- 60-second cooldown between resends
- Button shows countdown timer
- Uses `sessionStorage` to persist cooldown across tab switches

### 3. CAPTCHA & Rate Limiting

**hCaptcha on sign-up form:**
- Widget loaded from `https://js.hcaptcha.com/1/api.js`
- Renders below the sign-up form fields
- Submit button disabled until captcha solved
- Env var: `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`

**Server-side captcha verification:**
- New route: `app/api/auth/verify-captcha/route.ts`
- POST with `{ token }` body
- Validates against `https://api.hcaptcha.com/siteverify` using `HCAPTCHA_SECRET_KEY`
- Returns `{ success: boolean }`

**Client-side rate limiting:**
- Track failed sign-in attempts in `sessionStorage`
- Key: `auth_attempts` → `{ count, lastAttempt }`
- After 3 failures: disable sign-in button for 30 seconds
- Show countdown: "Try again in X seconds"
- Counter resets on success or after cooldown

### Architecture

```
app/login/page.tsx          ← Main login page (modified)
app/login/verify/page.tsx   ← NEW: Email verification page
app/api/auth/verify-captcha/route.ts  ← NEW: hCaptcha server verification
context/AuthContext.tsx     ← No changes needed
```

### Data Flow

**Sign-up:**
1. User fills form → solves hCaptcha → accepts privacy consent
2. Client validates email regex, password length, captcha token, consent
3. POST `/api/auth/verify-captcha` with hCaptcha token
4. If captcha fails → show error
5. `createUserWithEmailAndPassword` → Firebase Auth
6. `sendEmailVerification` → Firebase sends email
7. `ensureUserProfile` → Firestore
8. Redirect to `/login/verify`

**Sign-in:**
1. User fills email + password
2. Client validates email regex, password length
3. Check rate limit → if blocked, show countdown
4. `signInWithEmailAndPassword` → Firebase Auth
5. Check `emailVerified` → if false, show error + resend option
6. If verified → `ensureUserProfile` → redirect to `/dashboard`

### Error Handling

| Scenario | User Message |
|----------|-------------|
| Invalid email format | "Please enter a valid email address" |
| Password too short | "Password must be at least 8 characters" |
| Captcha not solved | "Please complete the captcha" |
| Captcha verification failed | "Captcha verification failed. Please try again." |
| Email already in use | "An account with this email already exists" |
| Email not verified (sign-in) | "Please verify your email before signing in" |
| Rate limited | "Too many attempts. Try again in X seconds" |
| Wrong password | "Incorrect password" |

### New Translation Keys

```
'login.errorValidEmail': 'Please enter a valid email address'
'login.errorEmailNotVerified': 'Please verify your email before signing in'
'login.verifyEmailTitle': 'Check your email'
'login.verifyEmailSubtitle': 'We sent a verification link to {email}'
'login.verifyEmailResend': 'Resend verification email'
'login.verifyEmailResendCooldown': 'Resend in {seconds}s'
'login.verifyEmailBackToSignIn': 'Back to sign in'
'login.passwordStrengthWeak': 'Weak'
'login.passwordStrengthFair': 'Fair'
'login.passwordStrengthGood': 'Good'
'login.passwordStrengthStrong': 'Strong'
'login.errorCaptchaRequired': 'Please complete the captcha'
'login.errorCaptchaFailed': 'Captcha verification failed. Please try again.'
'login.errorRateLimited': 'Too many attempts. Try again in {seconds}s'
'login.passwordStrength': 'Password strength'
```

### Environment Variables

- `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` — hCaptcha site key (client)
- `HCAPTCHA_SECRET_KEY` — hCaptcha secret key (server only)

### Security Notes

- hCaptcha secret key must never be exposed to client
- Rate limit uses `sessionStorage` (not localStorage) so it clears on tab close
- Email verification is enforced on every sign-in, not just first time
- Privacy consent is enforced via state, not HTML `required` attribute
