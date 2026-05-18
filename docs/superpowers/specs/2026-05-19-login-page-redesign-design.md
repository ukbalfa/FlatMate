# Login Page Redesign — Professional Bold & Geometric

**Date:** 2026-05-19
**Status:** Approved
**Author:** opencode + user brainstorming session

## Problem Statement

The current login page looks "beta" — too long, with animated blobs that feel playful rather than professional. The layout is wide and the visual hierarchy lacks polish. Users need a "Back to Home" button to navigate back to the landing page.

## Design Direction

**Bold & Geometric** — Professional, compact, and production-ready. Sharp geometric accents, subtle grid patterns, thin gradient accent bar, and a tight card layout.

## Layout & Structure

### Page Layout
- **Single centered layout** — full-screen dark background with centered card
- **Remove LeftPanel** from login page (component kept for potential reuse)
- **Card max-width:** `380px` (vs current `max-w-md` = 448px)
- **Background:** `#050505` with subtle dot grid pattern (radial gradient, 24px spacing)
- **Top accent bar:** 3px height, full-width, gradient `#F97316 → #FBBF24 → #84CC16`
- **Geometric accents:** 
  - Circle (300px) top-right corner, border `rgba(249, 115, 22, 0.06)`
  - Rotated square (200px, 45deg) bottom-left corner, border `rgba(132, 204, 22, 0.04)`
- **Geometric shapes hidden on mobile** (`< 480px`) for performance

### Back to Home Button
- Positioned above card, top-left aligned
- `← Back to Home` with arrow icon
- Color: `rgba(255,255,255,0.5)`, hover to white
- Uses `Link` from Next.js, points to `/`
- Framer Motion fade-in with `0.2s` delay

## Visual Design

### Card
- Background: `rgba(255, 255, 255, 0.02)`
- Border: `1px solid rgba(255, 255, 255, 0.06)`
- Border-radius: `16px`
- Padding: `32px`
- No backdrop blur

### Typography
- Heading: `22px, font-weight 600, letter-spacing: -0.02em`, color: white
- Subtitle: `13px, color: rgba(255,255,255,0.45)`
- Body text: `13px` throughout
- Error text: `12px, color: red-400`

### Logo Area
- Icon: `36x36px` rounded square (`border-radius: 10px`), gradient `#F97316 → #FBBF24`, letter "F" in white
- Brand: `18px, font-weight 600`, color: white
- Tagline: `"Shared living, simplified"`, `11px, color: rgba(255,255,255,0.4)`

### Tab Switcher
- Container: `padding: 3px, background: rgba(255,255,255,0.04), border: 1px solid rgba(255,255,255,0.06), border-radius: 10px`
- Active tab: gradient background, white text, `border-radius: 8px`
- Inactive tab: transparent, muted text
- Font: `13px, font-weight 500`

### Input Fields
- Height: `40px`
- Background: `rgba(255,255,255,0.03)`
- Border: `1px solid rgba(255,255,255,0.08)`, `border-radius: 10px`
- Padding: `0 14px`
- Focus: `ring-2 ring-accent/30, border-accent`
- Error state: `border-red-400, focus:ring-red-400/30`

### Primary Button
- Background: `linear-gradient(135deg, #F97316, #FBBF24)`
- Height: `42px`
- Border-radius: `10px`
- Box-shadow: `0 4px 16px rgba(249, 115, 22, 0.25)`
- Text: `14px, font-weight 500, white`
- Disabled: `opacity-60`

### OAuth Buttons
- Two side-by-side, flex gap `10px`
- Height: `38px`
- Background: `rgba(255,255,255,0.04)`
- Border: `1px solid rgba(255,255,255,0.08)`, `border-radius: 10px`
- Text: `12px, color: rgba(255,255,255,0.7)`
- Icons: Google (white circle), Telegram (`#2AABEE` circle)

### Divider
- Thin lines (`1px, rgba(255,255,255,0.08)`) on each side
- Text: `"or continue with email"`, `11px, uppercase, letter-spacing: 0.05em, color: rgba(255,255,255,0.3)`

### Footer Link
- `"Don't have an account? Sign up"` / `"Already have an account? Sign in"`
- Text: `13px, color: rgba(255,255,255,0.4)`
- Action link: `color: #F97316, font-weight 500`

### Password Strength Meter
- 3 bars, height `4px`, gap `4px`
- Colors: weak=red, fair=orange, good=yellow, strong=green
- Label: `11px, color: rgba(255,255,255,0.4)`

### Verification Step
- Mail icon in circle: `56x56px, bg-accent/10, ring-accent/20`
- Heading: `18px, font-weight 600`
- Subtitle: `13px, color: rgba(255,255,255,0.45)`
- Resend button: same primary button style
- Back to sign-in link: `13px, color: #F97316`

## Animations (Framer Motion)

- **Card mount:** `opacity: 0→1, y: 20→0, duration: 0.4s, easeOut`
- **Back link mount:** `opacity: 0→1, delay: 0.2s, duration: 0.3s`
- **Tab switch:** smooth background transition on active pill
- **Error messages:** `opacity: 0→1, y: 5→0, duration: 0.2s`
- **Verification step:** `opacity: 0→1, y: 10→0, duration: 0.3s`
- **No blob animations** — replaced with static geometric shapes

## Component Structure

### Files Modified
- `app/login/page.tsx` — main page, rewritten with new layout/styling
- `app/login/OAuthButtons.tsx` — minor styling updates for new button sizes

### Files Unchanged (but kept)
- `app/login/LeftPanel.tsx` — removed from login page import, kept for potential reuse
- `app/login/verify/page.tsx` — same visual treatment applied for consistency

### Files Unchanged
- `context/AuthContext.tsx` — no auth logic changes
- `context/I18nContext.tsx` — all i18n keys preserved
- `context/ThemeContext.tsx` — no theme changes
- `lib/firebase.ts` — no Firebase changes
- All API routes — no backend changes

## Responsive Behavior

- **Desktop (> 480px):** Card centered at `380px` width
- **Mobile (≤ 480px):** Card stretches to `calc(100vw - 32px)`, horizontal padding `16px`
- **Mobile:** Dot grid and geometric shapes hidden
- **Mobile:** Top accent bar always visible
- **Mobile:** Logo area always visible (no separate mobile logo needed)

## Accessibility

- All existing ARIA attributes preserved (tablist, tab, tabpanel, aria-invalid, aria-describedby, role="alert")
- Keyboard navigation preserved (ArrowLeft/ArrowRight for tabs)
- Focus states preserved (ring-2 on inputs)
- Color contrast maintained (white text on dark backgrounds, accent color for links)
- hCaptcha accessibility unchanged

## Internationalization

- All existing i18n keys preserved
- No new translation keys required
- Tagline `"Shared living, simplified"` uses hardcoded English (can be i18n'd later if needed)

## Non-Goals

- No changes to authentication logic
- No changes to Firebase integration
- No changes to hCaptcha integration
- No changes to rate limiting
- No changes to password strength calculation
- No changes to email verification flow
- No changes to Telegram OIDC or Google OAuth flows
- No new dependencies
