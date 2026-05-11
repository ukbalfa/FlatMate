# FlatMate Dashboard — Comprehensive Analysis of Missing Features, Logic Gaps & Improvements

## 1. CRITICAL MISSING FEATURES

### 1.1 Authentication & Security
| Feature | Status | Impact | Suggested Implementation |
|---------|--------|--------|------------------------|
| **Account Recovery (Password Reset)** | MISSING | High | Add "Forgot Password" link on login page, integrate with Firebase `sendPasswordResetEmail` |
| **Session Timeout / Idle Logout** | MISSING | Medium | Auto-logout after 30 minutes of inactivity to enhance security |
| **Rate Limiting (Login Attempts)** | MISSING | High | Prevent brute force attacks with exponential backoff |
| **Multi-Factor Authentication (MFA)** | MISSING | Medium | Optional OTP via SMS for sensitive actions (deleting expenses, changing budgets) |
| **IP/Device Logging** | MISSING | Low | Track login devices for security auditing |

### 1.2 Expense Management (High Priority)
| Feature | Status | Impact | Details |
|---------|--------|--------|---------|
| **Recurring Expenses** | PARTIAL | Critical | `recurringExpenses` collection exists but isn't fully activated. Need auto-creation on due date |
| **Expense Categories Management** | MISSING | High | Users cannot add custom categories (currently hardcoded: Rent, Groceries, Utilities, Internet, Misc) |
| **Expense Editing** | MISSING | Critical | Can add/delete but CANNOT edit existing expenses |
| **Multi-Currency Support** | MISSING | High | Only UZS hardcoded. Need currency conversion with rates page integration |
| **Expense Tags/Labels** | MISSING | Medium | Add tags for better filtering (e.g., "shared", "personal", "urgent") |
| **Expense Templates** | MISSING | Medium | Quick-add templates for common expenses (e.g., "Monthly Rent", "Weekly Groceries") |
| **Approval Workflow** | MISSING | Medium | Admin approval for expenses above a threshold |
| **Expense Notes / Attachments (more than images)** | MISSING | Low | Support PDF attachments, links |
| **Expense Search & Filter** | MISSING | High | Search by keyword, filter by date range, category, payer |
| **Expense Duplicate Detection** | MISSING | Low | Warn if similar expense added within short time |

### 1.3 Task Management
| Feature | Status | Impact | Details |
|---------|--------|--------|---------|
| **Task Editing** | MISSING | High | Can add/delete but cannot edit tasks |
| **Task Categories/Priorities** | MISSING | Medium | Add priority levels (Low, Medium, High, Urgent) with color coding |
| **Task Recurring / Repeat** | MISSING | Medium | Daily, weekly, monthly recurring tasks |
| **Task Comments** | MISSING | Low | Add comments to discuss tasks |
| **Task Deadline Reminders** | MISSING | Medium | Push notifications 24h before due date |
| **Task Dependencies** | MISSING | Low | Task B cannot start until Task A is done |
| **Task Time Tracking** | MISSING | Low | Track how long tasks take |
| **Task Delegation History**| MISSING | Low | Show who assigned what to whom |
| **Bulk Task Operations**| MISSING | Medium | Mark multiple tasks as done simultaneously |

### 1.4 Cleaning Schedule
| Feature | Status | Impact | Details |
|---------|--------|--------|---------|
| **Cleaning Rotation System** | MISSING | High | Auto-rotate tasks weekly/monthly to ensure fairness |
| **Cleaning Quality Rating** | MISSING | Low | Rate task completion quality |
| **Cleaning History** | MISSING | Medium | View past weeks/months cleaning records |
| **Cleaning Trade/Swap** | MISSING | Low | Allow roommates to swap/trade cleaning days |
| **Cleaning Streaks** | MISSING | Very Low | Gamification: streaks for consecutive completed days |

### 1.5 Balances & Financial
| Feature | Status | Impact | Details |
|---------|--------|--------|---------|
| **Manual Expense Entry Protection**| MISSING | High | Anyone can record settlements — no verification |
| **Payment Integration (Mock)** | MISSING | Medium | Mock "Pay Now" button that tracks payments in app |
| **Debt Reminders** | MISSING | Medium | Automatic reminders for overdue debts |
| **Expense Export (CSV/PDF)** | MISSING | High | Currently only Download button exists (icon in expenses page) but no functionality |
| **Income Tracking** | MISSING | Medium | Track deposits/income to account for shared funds |
| **Budget Alerts** | PARTIAL | Medium | Budget tracker exists but no alert via notification when exceeded |
| **Savings Goals** | MISSING | Medium | E.g., "Vacation Fund" with shared target |

### 1.6 Announcements & Communication
| Feature | Status | Impact | Details |
|---------|--------|--------|---------|
| **Announcements Editing** | MISSING | Medium | Cannot edit posted announcements |
| **Announcements Reactions** | MISSING | Low | Like/emoji reactions |
| **Announcements Comments** | MISSING | Low | Threaded comments for discussions |
| **Polling/Voting** | MISSING | Medium | Poll feature for decisions ("Who wants to switch WiFi provider?") |

### 1.7 Roommate Management
| Feature | Status | Impact | Details |
|---------|--------|--------|---------|
| **Roommate Account Transfer** | MISSING | Low | Transfer admin role to another user with confirmation |
| **Roommate Inactivity Detection** | MISSING | Low | Highlight inactive roommates |
| **Roommate Score/Reputation** | MISSING | Low | Gamification: karma score based on task completion |
| **Roommate Block/Mute** | MISSING | Very Low | Hide specific roommate's activities |

### 1.8 Settings & Configuration
| Feature | Status | Impact | Details |
|---------|--------|--------|---------|
| **Currency Preferences** | MISSING | High | Set default currency per flat |
| **Notification Preferences Deep Config** | PARTIAL | Medium | Only 4 basic toggles — needs granular controls (email, push, in-app) |
| **Display Preferences (Density, Font Size)** | MISSING | Low | Accessibility: compact/spacious view, font scaling |
| **Data Export / GDPR** | MISSING | Medium | Export all personal data, right to deletion |
| **Login History** | MISSING | Low | View recent login sessions |
| **Two-Factor Authentication (TOTP)** | MISSING | High | Add TOTP-based 2FA using QR codes |

### 1.9 Dashboard & UX
| Feature | Status | Impact | Details |
|---------|--------|--------|---------|
| **Calendar View** | MISSING | High | Visual calendar showing tasks, cleaning, expenses by date |
| **Dashboard Widgets** | MISSING | Medium | Customizable dashboard: rearrange, hide/show widgets |
| **Activity Feed Improvements** | PARTIAL | Medium | Only shows expenses + tasks — missing cleaning, settlements, announcements |
| **Search Global** | MISSING | Critical | Global search across expenses, tasks, roommates, announcements |
| **Quick Actions / Command Palette** | MISSING | High | Keyboard shortcut (Cmd+K) for quick navigation |
| **Keyboard Shortcuts Help** | MISSING | Low | Modal showing all available shortcuts |
| **Onboarding Tour for New Users** | MISSING | Medium | First-time user walkthrough |
| **Changelog / What's New** | MISSING | Low | Modal showing recent updates |

### 1.10 Analytics & Reporting
| Feature | Status | Impact | Details |
|---------|--------|--------|---------|
| **Expense Trends (YoY/MoM)** | PARTIAL | Medium | Basic monthly chart exists but no year-over-year comparison |
| **Cost Per Roommate Over Time** | MISSING | Medium | Line chart showing each roommate's monthly spend |
| **Largest Expenses of Month** | MISSING | Low | Highlight top 5 expenses |
| **Spending Heatmap** | MISSING | Very Low | Calendar heatmap of spending intensity |
| **Predictive Budgeting** | MISSING | Very Low | AI-suggested budget based on historical data |

---

## 2. LOGIC & ARCHITECTURAL GAPS

### 2.1 Data Consistency
```
Issue: Deletion of user doesn't clean up their sub-collections
Fix: Add Cloud Functions or server-side cleanup on user deletion
```

### 2.2 Transaction Integrity
```
Issue: No atomic transactions for multi-step operations
Example: When adding an expense split, notifications are sent separately
Fix: Use Firestore batched writes for atomic operations
```

### 2.3 Missing Validations
| Area | Missing Validation | Risk |
|------|-------------------|------|
| Expense amount | No max limit check | Negative/troll entries possible |
| Task due date | Past dates allowed | Tasks can be "due" in the past |
| Username uniqueness | Not enforced client-side | Duplicate usernames possible |
| Phone format | No format validation | Invalid phone numbers stored |
| Infinite recursion | Not checked | Recurring expenses could duplicate incorrectly |

### 2.4 Missing Indices
```
Firestore indexes needed:
- expenses: flatId + date (desc)
- tasks: flatId + dueDate (asc) + done (desc)
- cleaning: flatId + weekStart + dayOfWeek
- settlements: flatId + date (desc)
```

### 2.5 Race Conditions
```
Issue: Two admins editing same budget / task simultaneously
Fix: Implement optimistic locking with timestamp-based versioning
```

---

## 3. UI/UX IMPROVEMENTS

### 3.1 Critical UI/UX Gaps
| Issue | Screenshot Needed | Priority |
|-------|-------------------|----------|
| **No mobile-optimized bottom nav** | Header only has hamburger | High — Add bottom bar for quick access on mobile |
| **Inconsistent dark mode usage** | Tasks page uses `dark:` classes but dashboard layout already enforces dark | Medium — Unify styling approach |
| **Rent Countdown not implemented** | `<RentCountdown />` imported but logic unknown (likely missing) | High — Implement adjustable rent due date |
| **No loading skeletons on expense cards** | `<SkeletonList />` only present for tables | Medium — Add skeleton for card layouts |
| **Toast notification limit** | Too many toasts can overwhelm user | Low — Debounce or batch toast notifications |

### 3.2 Missing Buttons
| Page | Missing Button | Action |
|------|---------------|--------|
| Expenses | "Edit" | Edit existing expense |
| Expenses | "Duplicate" | Clone expense for similar entry |
| Tasks | "Edit" | Modify task text, date, assignee |
| Tasks | "Reassign" | Change assignee without deleting |
| Tasks | "Add to Calendar" | Export to personal calendar (.ics) |
| Balances | "Settle All" | Mark all debts as resolved |
| Balances | "Send Reminder" | Notify debtor via in-app notification |
| Roommates | "Transfer Admin" | Promote roommate to admin |
| Roommates | "Deactivate Account" | Soft-delete/disable roommate account |
| Settings | "Danger Zone" | Delete account, leave flat, transfer ownership |
| Announcements | "Edit" | Modify posted announcements |
| Announcements | "Archive" | Hide old announcements without deleting |
| Dashboard | "Add Quick Expense" | Inline mini-form without navigating to Expenses page |
| Dashboard | "Mark All Done" | Bulk-complete tasks from dashboard |

### 3.3 Missing Sections
| Section | Location | Purpose |
|---------|----------|---------|
| **Calendar View** | New page (`/dashboard/calendar`) | Visual overview of tasks, cleaning, expenses |
| **Reports/Analytics** | New page (`/dashboard/reports`) | Deep-dive financial analysis |
| **Notifications Center** | Topbar enhancement | Dedicated page for all notifications history |
| **Help & Support** | Settings or new page | FAQ, contact support, bug reporting |
| **Flat Preferences** | Settings or new page | Flat-wide settings (currency, timezone, rent date) |
| **Audit Log** | Admin-only page | Track all changes (who did what when) |
| **Trash/Recycle Bin** | Admin-only | Soft-deleted items with restore option |

---

## 4. DATABASE & DEVOPS IMPROVEMENTS

### 4.1 Missing Collections/Fields
```
users:
  - lastLoginAt: timestamp  [NEW FIELD]
  - notificationPreferences: object (expanded)  [EXPAND]
  - deviceTokens: string[]  [NEW FIELD for push notifications]
  - language: string  [NEW FIELD]

expenses:
  - updatedAt: timestamp  [NEW FIELD]
  - deletedAt: timestamp (for soft delete)  [NEW FIELD]
  - createdBy: string  [NEW FIELD]

[NEW COLLECTION] expenseCategories:
  - flatId: string
  - name: string
  - color: string
  - budgetLimit: number
  - isDefault: boolean

[NEW COLLECTION] auditLog:
  - action: string
  - entityType: string
  - entityId: string
  - performedBy: string
  - timestamp: timestamp
  - changes: object

[NEW COLLECTION] flatSettings:
  - flatId: string
  - currency: string (default: 'UZS')
  - timezone: string
  - rentDueDay: number (1-31)
  - rentAmount: number
```

### 4.2 Cloud Functions (Recommended)
```
functions:
  onUserDeleted:           Clean up user data across collections
  onExpenseAdded:          Update budgets, notify split members
  onTaskDueSoon:           Send reminder notifications
  onCleaningRotate:        Rotate cleaning schedule weekly
  onRecurringExpenseDue:   Auto-create expense record
  weeklySummary:           Aggregate and email weekly report
```

### 4.3 Testing Gaps
| Area | Current Coverage | Needed |
|------|-----------------|--------|
| Unit tests | Partial | Complete coverage of utility functions |
| Component tests | Minimal | Add React Testing Library for key components |
| Integration tests | None | Add Playwright/Cypress for critical flows |
| Firestore rules tests | None | Test security rules thoroughly |
| E2E tests | None | Login → Add expense → View balances flow |

---

## 5. PERFORMANCE IMPROVEMENTS

| Issue | Solution |
|-------|----------|
| **Expenses pagination** | Currently loads all then filters client-side. Use Firestore cursor-based pagination. |
| **Images/receipts** | Implement lazy loading, thumbnail generation |
| **Bundle size** | Code-split `Recharts`, lazy load analytics dashboard |
| **Real-time subscriptions** | Unsubscribe on page unmount to reduce Firestore reads |
| **Debounced search** | Add 300ms debounce to search inputs |
| **Memoization** | `useMemo`/`useCallback` optimization throughout |
| **Service Worker** | Add PWA support with offline-first caching |

---

## 6. ACCESSIBILITY (a11y)

| Issue | Fix |
|-------|-----|
| **Missing ARIA labels** | Add `aria-label` to all icon-only buttons |
| **No focus management** | Implement focus trap for modals, autofocus on form open |
| **No skip links** | Add "Skip to main content" link |
| **Color contrast** | Verify all text meets WCAG AA (some white/gray combinations may fail) |
| **Keyboard navigation** | Ensure all interactive elements reachable via Tab |
| **Screen reader headings** | Add `<h1>` to every page for semantic structure |
| **No `prefers-reduced-motion`** | Respect user animation preferences |

---

## 7. IMPLEMENTATION PRIORITY MATRIX

### P0 (Must Have - Critical)
1. Expense Editing functionality
2. Task Editing functionality
3. Global Search (across expenses, tasks, roommates)
4. Password Reset / Account Recovery
5. Calendar View page
6. Expense Export (CSV/PDF)
7. Recurring Expenses activation

### P1 (Should Have - High Value)
8. Universal currency support
9. Custom expense categories
10. Transaction integrity (Firestore batch writes)
11. Notification deep customization
12. Cleaning rotation/schedule automation
13. Mobile bottom navigation
14. Onboarding tour

### P2 (Nice to Have - Enhancements)
15. Expense templates
16. Task priorities & categories
17. Polls/voting in announcements
18. Gamification (streaks, scores)
19. Dark mode toggle (if not already dark-only design)
20. Keyboard shortcuts / Command palette
21. Analytics deep-dive (reports page)

---

*This analysis was generated for the FlatMate Dashboard v0.1.1 based on the current codebase structure.*
