# Rent Hub — Implementation Spec

> **Goal:** A dedicated `/dashboard/rent` page (Full Rent Hub) that replaces and extends the existing `RentCountdown` widget on the dashboard home. The page stores all rent-related data in Firestore under a `rent` subcollection on the flat document.

## Architecture

**Data model:** All rent data lives under `flats/{flatId}/rent` as a single document (rent config) plus a `payments` subcollection for payment history.

```
flats/{flatId}/
  rent/settings  ← rent configuration (amount, due day, landlord, property, etc.)
  rent/payments/{paymentId}  ← each payment record with proof URL
```

The existing `RentCountdown` component is **replaced** by a `RentHubWidget` that reads from the same `rent/settings` document and shows just the countdown. The full page at `/dashboard/rent` shows everything.

**Admin-only fields:** landlord info, payment instructions, property details, rent amount. **All roommates** can view everything. **Any roommate** can mark rent as paid (with receipt) — not just admin.

---

## Firestore Data Model

### `flats/{flatId}/rent/settings` document

```typescript
interface RentSettings {
  // Amount
  monthlyRent: number;          // e.g. 4500000 (UZS)
  currency: string;             // "UZS" (default), "USD"

  // Schedule
  dueDay: number;              // 1-28, day of month
  autoReminderDays: number;    // days before due to send reminder (default: 3)

  // Property info (admin editable)
  property: {
    address: string;
    buildingType?: string;      // e.g. "5-story apartment"
    floor?: string;            // e.g. "3rd floor"
    unit?: string;             // e.g. "Apt 12"
    rooms?: string;            // e.g. "3BR + 2Bath"
    moveInDate?: string;        // ISO date
    leaseEndDate?: string;     // ISO date
  };

  // Landlord info (admin editable)
  landlord: {
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
  };

  // Payment instructions (admin editable)
  paymentInstructions: {
    bankName?: string;
    cardNumber?: string;
    accountName?: string;
    additionalInfo?: string;
  };

  // Current month status
  currentMonthPaid: boolean;
  currentMonthPaidBy?: string;   // uid
  currentMonthPaidAt?: string;   // ISO date
  currentMonthReceiptUrl?: string;
  currentMonthNote?: string;

  // Notes (all roommates can add)
  notes: string;
}
```

### `flats/{flatId}/rent/payments/{paymentId}` document

```typescript
interface RentPayment {
  id: string;
  month: string;                // "2026-04" (YYYY-MM)
  amount: number;
  paidBy: string;               // uid
  paidByName?: string;
  paidAt: string;               // ISO date
  receiptUrl?: string;
  note?: string;
  createdAt: string;            // ISO date
}
```

---

## Page: `/dashboard/rent`

**Route guard:** `useAuth()` — redirect to `/login` if unauthenticated.

### Sections (top to bottom)

1. **Page header** with title "Rent Hub" and admin "Edit Settings" button (opens settings modal)
2. **4 stat cards**: Monthly Rent, Next Due (days + date), Status (Paid / Due Today / Overdue), Lease Ends
3. **"Mark as Paid" banner** (only when rent is due/overdue): shows who should pay, "Mark as Paid" button → opens payment modal
4. **2x2 grid** of info cards:
   - **Property Details** (admin only — pencil icon to edit)
   - **Landlord Info** (admin only — pencil icon)
   - **Payment Instructions** (admin only — pencil icon)
   - **Rent Notes** (all roommates — add/edit note)
5. **Payment History table**: Month, Amount, Paid By, Date, Proof (📎 link), Status

### Modals

- **Edit Settings Modal**: Single modal with tabs (Property | Landlord | Payment). Admin-only. Saves to `rent/settings`.
- **Mark as Paid Modal**: Any roommate. Fields: Paid by (dropdown of flat members), Amount (pre-filled), Date (pre-filled today), Receipt (drag-drop upload), Note (optional). On confirm: creates `rent/payments/{id}`, updates `rent/settings.currentMonthPaid: true`.
- **View Receipt Modal**: Opens uploaded receipt image/PDF in a modal with download link.

### Admin Settings Defaults

On first load (if no `rent/settings` document exists), show a **bootstrap modal** — the admin fills in: monthly rent amount, due day, landlord name, payment instructions. After saving, creates the document and shows the hub.

---

## Dashboard Widget: `RentHubWidget`

A compact card that replaces `RentCountdown` on the dashboard home page. Reads from `rent/settings`:

- Shows: rent amount, days until due / "Due Today" / "PAID"
- "Mark as Paid" button (any roommate)
- Clicking the card navigates to `/dashboard/rent`

The `RentCountdown` component is removed from the codebase.

---

## Navigation

New nav link in `app/dashboard/layout.tsx` (`navLinks` array):
```typescript
{ href: "/dashboard/rent", label: "nav.rent", icon: Home },
```

New i18n keys:
- `nav.rent`: "Rent"
- Full set of `rent.*` keys for all UI text (en/ru/uz)

---

## Firestore Security Rules

Update `firestore.rules`:
- `match /flats/{flatId}/rent/settings` — allow read for any flat member, allow write for admin only
- `match /flats/{flatId}/rent/payments/{paymentId}` — allow create for any flat member, read for all members, no update/delete (immutable records)

Also need composite index (collection group query):
- `rent.payments`: `month DESC` (collection group, no flatId filter needed — subcollection lives under the flat doc, access controlled by parent flat rules)

---

## Implementation Order

1. Update Firestore rules + deploy
2. Add `RentPayment` type to `lib/types.ts`
3. Extend `RentSettings` type in `lib/types.ts`
4. Add Firestore indexes for `rent/payments` collection group
5. Create `app/dashboard/rent/page.tsx` (stub, full page)
6. Create `MarkAsPaidModal` component
7. Create `RentSettingsModal` component
8. Create `RentHubWidget` component
9. Create `ReceiptModal` component
10. Wire up the page with all sections and modals
11. Update `app/dashboard/page.tsx` to use `RentHubWidget` instead of `RentCountdown`
12. Update nav links in `dashboard/layout.tsx`
13. Add all i18n keys (en/ru/uz)
14. Update Firebase storage rules for receipt uploads
15. Run lint, build, test
16. Deploy rules and indexes

---

## Files to Create

- `app/dashboard/rent/page.tsx` — full Rent Hub page
- `app/dashboard/rent/components/MarkAsPaidModal.tsx`
- `app/dashboard/rent/components/RentSettingsModal.tsx`
- `app/dashboard/rent/components/ReceiptModal.tsx`
- `app/components/RentHubWidget.tsx` — replaces RentCountdown

---

## Files to Modify

- `lib/types.ts` — extend types
- `context/I18nContext.tsx` — add all rent keys (en/ru/uz)
- `app/dashboard/page.tsx` — replace RentCountdown with RentHubWidget
- `app/dashboard/layout.tsx` — add nav link for Rent
- `firestore.rules` — add rent subcollection rules
- `firestore.indexes.json` — add rent.payments index
- `firebase.json` — add Storage rules
- `app/components/RentCountdown.tsx` — delete

---

## Out of Scope (v1)

- Lease renewal reminders
- Multiple payment splitting (everyone pays their share automatically)
- WhatsApp / Telegram notification integration
- PDF receipt generation