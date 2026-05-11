# Recurring Tasks + Recurring Items Sync

## Summary
Add a `recurringTasks` Firestore collection and generation engine (mirroring existing `recurringExpenses` pattern), wire up both engines with a shared sync mechanism, and add a Recurring Tasks tab to the Tasks page.

## Types (`lib/types.ts`)
- Add `RecurringTask` interface: flatId, text, assignedTo, priority?, createdBy, startDate, endDate?, pattern (daily|weekly|monthly|yearly), createdAt, lastGeneratedDate?
- Extend `Task` with: isRecurring?, recurrencePattern?, parentTaskId?

## Engine (`lib/recurringTasksEngine.ts`)
- `generateMissingRecurringTasks(flatId)` — queries `recurringTasks` collection, advances from lastGeneratedDate/startDate to today, creates Task docs via batched Firestore writes (same logic as `recurringExpensesEngine.ts`)

## Sync (`lib/syncRecurring.ts`)
- `syncRecurringItems(flatId)` — calls both `generateMissingRecurringExpenses(flatId)` and `generateMissingRecurringTasks(flatId)`
- Called on mount of Expenses page and Tasks page
- Manual "Sync" button on recurring tab/section of each page

## Tasks Page UI
- Tabs: **One-time** | **Recurring**
- Recurring tab: form (text, assign, priority, pattern, startDate, endDate) + template list with delete + sync button
- Generated tasks appear in regular task list with a Repeat indicator

## Firestore
- New `recurringTasks` collection in rules (same tenant isolation pattern)
- Composite index: flatId ASC, createdAt DESC

## Translations
- New keys for recurring tasks labels, form fields, toast messages, patterns (EN/RU/UZ)
