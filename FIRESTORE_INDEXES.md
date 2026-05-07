# Firestore Composite Indexes Required

After adding query limits and ordering to Firestore queries, the following composite indexes are required in the Firebase Console.

## Required Indexes

### 1. Notifications Collection
**Query Pattern**: `where('userId', '==', ...) + orderBy('createdAt', 'desc') + limit(100)`

**Index Configuration**:
- Collection: `notifications`
- Fields to index:
  - `userId` (Ascending)
  - `createdAt` (Descending)

**Firebase CLI command** (alternative to manual creation):
```bash
firebase firestore:indexes:create --project=YOUR_PROJECT_ID
```

Or create manually in Firebase Console → Firestore → Indexes → Composite Indexes:
- Collection ID: `notifications`
- Fields:
  1. `userId` - Ascending
  2. `createdAt` - Descending

---

### 2. Expenses Collection (in Balances page)
**Query Pattern**: `where('date', '>=', ...) + where('date', '<=', ...) + orderBy('date', 'desc') + limit(200)`

**Index Configuration**:
- Collection: `expenses`
- Fields to index:
  - `date` (Descending)

Note: Single field index on `date` is typically automatic, but verify in Firebase Console.

---

### 3. Settlements Collection (in Balances page)
**Query Pattern**: `where('date', '>=', ...) + where('date', '<=', ...) + orderBy('date', 'desc') + limit(100)`

**Index Configuration**:
- Collection: `settlements`
- Fields to index:
  - `date` (Descending)

Note: Single field index on `date` is typically automatic, but verify in Firebase Console.

---

## Single Field Indexes (Usually Automatic)

The following fields need to be indexed (usually automatic in Firestore):

| Collection | Field | Purpose |
|------------|-------|---------|
| `expenses` | `createdAt` | Ordering expenses by creation date (desc) with limit(200) |
| `expenses` | `date` | Filtering expenses by date range in balances page |
| `tasks` | `dueDate` | Ordering tasks by due date with limit(100) |
| `announcements` | `createdAt` | Ordering announcements by creation date (desc) with limit(50) |
| `settlements` | `createdAt` | Ordering settlements by creation date |
| `settlements` | `date` | Filtering settlements by date range |
| `users` | `createdAt` | Ordering users by creation date (desc) |
| `recurringExpenses` | `createdAt` | Ordering recurring expenses by creation date (desc) with limit(200) |
| `notifications` | `userId` | Filtering notifications by user ID |
| `notifications` | `createdAt` | Ordering notifications by creation date (desc) |

---

## How to Create Indexes

### Option 1: Via Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Add index**
5. Configure as specified above
6. Click **Create index**

### Option 2: Via Firebase CLI
Create a `firestore.indexes.json` file:

```json
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "mode": "ASCENDING" },
        { "fieldPath": "createdAt", "mode": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "mode": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "settlements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "mode": "DESCENDING" }
      ]
    }
  ]
}
```

Then run:
```bash
firebase deploy --only firestore:indexes
```

### Option 3: Via Error Messages
When you run the app, if an index is missing, Firestore will return an error with a direct link to create the index. Click the link and Firebase will pre-configure the index for you.

---

## Changes Made

The following query optimizations were applied:

| File | Collection | Change |
|------|------------|--------|
| `app/dashboard/expenses/page.tsx` | `expenses` | Added `limit(200)` with `orderBy('createdAt', 'desc')` |
| `app/dashboard/expenses/page.tsx` | `recurringExpenses` | Added `limit(200)` |
| `app/dashboard/tasks/page.tsx` | `tasks` | Added `limit(100)` |
| `app/dashboard/announcements/page.tsx` | `announcements` | Added `limit(50)` |
| `context/NotificationsContext.tsx` | `notifications` | Added `limit(100)` |
| `app/dashboard/balances/page.tsx` | `settlements` | Added `limit(100)` with `orderBy('date', 'desc')` |
| `app/dashboard/balances/page.tsx` | `expenses` | Added `limit(200)` with `orderBy('date', 'desc')` |
| Multiple files | `users` | Added `orderBy('createdAt', 'desc')` |

---

## Notes

- The `createdAt` field is now being added to new documents in `expenses`, `tasks`, and `announcements` collections
- For existing documents without `createdAt`, they may not appear in ordered queries. Consider adding `createdAt` to existing documents via a migration script if needed.
- The limits are set to allow enough data for the UI while preventing unbounded reads
- Date-range queries in the balances page use `date` field (ISO string format `YYYY-MM-DD`) which is already present in the documents
