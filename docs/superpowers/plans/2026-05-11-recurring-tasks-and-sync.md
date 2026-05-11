# Recurring Tasks + Recurring Items Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add recurring task templates with a generation engine, wire up both recurring expense and task engines with a shared sync mechanism, and add a Recurring Tasks tab to the Tasks page.

**Architecture:** Follows existing `RecurringExpense` pattern exactly — separate `recurringTasks` Firestore collection + generation engine + UI tab. Both engines are called via a shared `syncRecurringItems()` function on page mount and via a manual sync button.

**Tech Stack:** TypeScript, Firebase/Firestore, Tailwind CSS v4, Next.js App Router, Jest

---

## File Structure

### Create:
- `lib/recurringTasksEngine.ts` — generation engine for recurring tasks
- `lib/syncRecurring.ts` — calls both engines
- `__tests__/recurringTasksEngine.test.ts` — unit tests for task engine
- `__tests__/syncRecurring.test.ts` — unit tests for sync utility

### Modify:
- `lib/types.ts` — add `RecurringTask` interface, extend `Task`
- `lib/recurringExpensesEngine.ts` — remove local `RecurringExpense` interface, import from types
- `context/I18nContext.tsx` — add recurring task translations (EN/RU/UZ)
- `app/dashboard/tasks/page.tsx` — add One-time/Recurring tabs + recurring CRUD
- `app/dashboard/expenses/page.tsx` — call sync on mount + add sync button
- `firestore.rules` — add `recurringTasks` collection rules
- `firestore.indexes.json` — add `recurringTasks` composite index

---

### Task 1: Add types

**Files:**
- Modify: `lib/types.ts`
- Test: `__tests__/types-test.ts` (verification only, not a real test file)

- [ ] **Step 1: Add `RecurringTask` and extend `Task` in `lib/types.ts`**

After the `Task` interface (line 132), add:

```typescript
export interface RecurringTask {
  id?: string;
  flatId: string;
  text: string;
  assignedTo: string;
  priority?: "low" | "medium" | "high";
  createdBy: string;
  startDate: string;
  endDate?: string | null;
  pattern: "daily" | "weekly" | "monthly" | "yearly";
  createdAt: string;
  lastGeneratedDate?: string;
}
```

Add these fields to the `Task` interface (after `priority`):

```typescript
  isRecurring?: boolean;
  recurrencePattern?: "daily" | "weekly" | "monthly" | "yearly";
  parentTaskId?: string;
```

- [ ] **Step 2: Run build to verify types compile**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add RecurringTask type and extend Task with recurring fields"
```

---

### Task 2: Fix recurringExpensesEngine to import from types

**Files:**
- Modify: `lib/recurringExpensesEngine.ts`

- [ ] **Step 1: Remove local interface and add import**

At top of `lib/recurringExpensesEngine.ts`, replace lines 1-19 with:

```typescript
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { RecurringExpense } from './types';
```

Then update the data cast on line 36 from `as RecurringExpense` (the local one) to use the imported one (it's the same interface so no other changes needed).

- [ ] **Step 2: Run tests to verify nothing broke**

Run: `npm run test -- __tests__/recurringExpensesEngine.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add lib/recurringExpensesEngine.ts
git commit -m "refactor: import RecurringExpense type from shared types"
```

---

### Task 3: Create recurringTasksEngine

**Files:**
- Create: `lib/recurringTasksEngine.ts`
- Test: `__tests__/recurringTasksEngine.test.ts`

- [ ] **Step 1: Write the failing test file**

Create `__tests__/recurringTasksEngine.test.ts`:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateMissingRecurringTasks } from '../lib/recurringTasksEngine';

jest.mock('../lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  writeBatch: jest.fn(),
  doc: jest.fn(),
}));

import { getDocs, writeBatch, doc } from 'firebase/firestore';

const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;

describe('recurringTasksEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-04T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateMissingRecurringTasks', () => {
    it('returns empty array when flatId is empty', async () => {
      const result = await generateMissingRecurringTasks('');
      expect(result).toEqual([]);
    });

    it('returns empty array when no recurring tasks exist', async () => {
      mockGetDocs.mockResolvedValueOnce({ docs: [] } as any);
      const result = await generateMissingRecurringTasks('flat-123');
      expect(result).toEqual([]);
    });

    it('skips recurring tasks with no startDate or lastGeneratedDate', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'rec-task-1', data: () => ({ flatId: 'flat-123', text: 'Clean kitchen', assignedTo: 'Alice', pattern: 'weekly' }), ref: { id: 'rec-task-1' } },
        ],
      } as any);
      const result = await generateMissingRecurringTasks('flat-123');
      expect(result).toEqual([]);
    });

    it('skips recurring tasks already up to date', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-2',
          data: () => ({ flatId: 'flat-123', text: 'Clean kitchen', assignedTo: 'Alice', pattern: 'weekly', lastGeneratedDate: '2025-06-04', startDate: '2025-01-01' }),
          ref: { id: 'rec-task-2' },
        }],
      } as any);
      const result = await generateMissingRecurringTasks('flat-123');
      expect(result).toEqual([]);
    });

    it('generates missed entries for weekly pattern', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-3',
          data: () => ({ flatId: 'flat-123', text: 'Clean kitchen', assignedTo: 'Alice', priority: 'high', pattern: 'weekly', startDate: '2025-05-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-3' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringTasks('flat-123');
      expect(result).toHaveLength(1);
      expect(result[0].generated).toBeGreaterThan(0);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('generates missed entries for monthly pattern', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-4',
          data: () => ({ flatId: 'flat-123', text: 'Pay bills', assignedTo: 'Bob', priority: 'medium', pattern: 'monthly', startDate: '2025-01-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-4' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringTasks('flat-123');
      expect(result[0].generated).toBeGreaterThan(0);
    });

    it('generates entries for daily pattern', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-5',
          data: () => ({ flatId: 'flat-123', text: 'Water plants', assignedTo: 'Charlie', pattern: 'daily', startDate: '2025-06-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-5' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringTasks('flat-123');
      expect(result[0].generated).toBe(3);
    });

    it('respects endDate', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-6',
          data: () => ({ flatId: 'flat-123', text: 'Monthly task', assignedTo: 'Alice', pattern: 'monthly', startDate: '2025-01-01', endDate: '2025-03-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-6' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringTasks('flat-123');
      expect(result[0].generated).toBe(2);
    });

    it('limits generated entries to 365 per recurring task', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-7',
          data: () => ({ flatId: 'flat-123', text: 'Daily task', assignedTo: 'Alice', pattern: 'daily', startDate: '2020-01-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-7' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringTasks('flat-123');
      expect(result[0].generated).toBeLessThanOrEqual(365);
    });

    it('updates lastGeneratedDate after processing', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-8',
          data: () => ({ flatId: 'flat-123', text: 'Monthly task', assignedTo: 'Alice', pattern: 'monthly', startDate: '2025-01-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-8' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      await generateMissingRecurringTasks('flat-123');
      expect(mockBatch.update).toHaveBeenCalledWith({ id: 'rec-task-8' }, { lastGeneratedDate: '2025-06-04' });
    });

    it('sets correct fields on generated task', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-9',
          data: () => ({ flatId: 'flat-123', text: 'Clean kitchen', assignedTo: 'Alice', priority: 'high', pattern: 'weekly', startDate: '2025-01-01', createdBy: 'admin' }),
          ref: { id: 'rec-task-9' },
        }],
      } as any);
      const mockDocRef = {};
      mockDoc.mockReturnValue(mockDocRef as any);

      await generateMissingRecurringTasks('flat-123');

      const setCall = mockBatch.set.mock.calls[0];
      expect(setCall[0]).toBe(mockDocRef);
      expect(setCall[1]).toMatchObject({
        flatId: 'flat-123',
        text: 'Clean kitchen',
        assignedTo: 'Alice',
        priority: 'high',
        dueDate: expect.any(String),
        createdBy: 'admin',
        done: false,
        isRecurring: true,
        recurrencePattern: 'weekly',
        parentTaskId: 'rec-task-9',
      });
    });

    it('handles yearly pattern correctly', async () => {
      const mockBatch = { set: jest.fn(), update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
      mockWriteBatch.mockReturnValue(mockBatch as any);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'rec-task-10',
          data: () => ({ flatId: 'flat-123', text: 'Annual review', assignedTo: 'Alice', pattern: 'yearly', startDate: '2023-06-04', createdBy: 'admin' }),
          ref: { id: 'rec-task-10' },
        }],
      } as any);
      mockDoc.mockReturnValue({} as any);

      const result = await generateMissingRecurringTasks('flat-123');
      expect(result[0].generated).toBe(2);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- __tests__/recurringTasksEngine.test.ts`
Expected: FAIL with "Cannot find module '../lib/recurringTasksEngine'"

- [ ] **Step 3: Create the engine implementation**

Create `lib/recurringTasksEngine.ts`:

```typescript
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { RecurringTask } from './types';

export async function generateMissingRecurringTasks(flatId: string) {
  if (!flatId) return [];

  const q = query(collection(db, 'recurringTasks'), where('flatId', '==', flatId));
  const snapshot = await getDocs(q);

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = new Date(todayStr);

  const BATCH_LIMIT = 500;
  let batch = writeBatch(db);
  let operationCount = 0;
  const results: { recurringId: string; generated: number }[] = [];

  for (const taskDoc of snapshot.docs) {
    const data = taskDoc.data() as RecurringTask;
    const recurringId = taskDoc.id;

    const baseDateStr = data.lastGeneratedDate || data.startDate;
    if (!baseDateStr) continue;

    if (baseDateStr >= todayStr) continue;

    const currentDate = new Date(baseDateStr);
    const nextDates: string[] = [];
    const maxEntries = 365;

    advanceDate(currentDate, data.pattern);

    const endDate = data.endDate ? new Date(data.endDate) : null;

    while (currentDate <= today && nextDates.length < maxEntries) {
      if (endDate && currentDate > endDate) break;
      nextDates.push(currentDate.toISOString().slice(0, 10));
      advanceDate(currentDate, data.pattern);
    }

    if (nextDates.length > 0) {
      for (const d of nextDates) {
        const newTaskRef = doc(collection(db, 'tasks'));
        batch.set(newTaskRef, {
          flatId,
          text: data.text,
          done: false,
          assignedTo: data.assignedTo,
          dueDate: d,
          createdBy: data.createdBy,
          priority: data.priority || null,
          createdAt: new Date().toISOString(),
          isRecurring: true,
          recurrencePattern: data.pattern,
          parentTaskId: recurringId,
        });
        operationCount++;
      }

      batch.update(taskDoc.ref, { lastGeneratedDate: todayStr });
      operationCount++;

      results.push({ recurringId, generated: nextDates.length });

      if (operationCount >= BATCH_LIMIT) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return results;
}

function advanceDate(date: Date, pattern: 'daily' | 'weekly' | 'monthly' | 'yearly') {
  if (pattern === 'daily') {
    date.setDate(date.getDate() + 1);
  } else if (pattern === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (pattern === 'monthly') {
    const currentDay = date.getDate();
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const maxDayInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    const targetDay = Math.min(currentDay, maxDayInNextMonth);
    date.setMonth(date.getMonth() + 1);
    date.setDate(targetDay);
  } else if (pattern === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- __tests__/recurringTasksEngine.test.ts`
Expected: All 10 tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/recurringTasksEngine.ts __tests__/recurringTasksEngine.test.ts
git commit -m "feat: add recurring tasks generation engine"
```

---

### Task 4: Create syncRecurring utility

**Files:**
- Create: `lib/syncRecurring.ts`
- Test: `__tests__/syncRecurring.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/syncRecurring.test.ts`:

```typescript
jest.mock('../lib/recurringExpensesEngine', () => ({
  generateMissingRecurringExpenses: jest.fn(),
}));
jest.mock('../lib/recurringTasksEngine', () => ({
  generateMissingRecurringTasks: jest.fn(),
}));

import { syncRecurringItems } from '../lib/syncRecurring';
import { generateMissingRecurringExpenses } from '../lib/recurringExpensesEngine';
import { generateMissingRecurringTasks } from '../lib/recurringTasksEngine';

const mockSyncExpenses = generateMissingRecurringExpenses as jest.MockedFunction<typeof generateMissingRecurringExpenses>;
const mockSyncTasks = generateMissingRecurringTasks as jest.MockedFunction<typeof generateMissingRecurringTasks>;

describe('syncRecurringItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls both engines with the given flatId', async () => {
    mockSyncExpenses.mockResolvedValueOnce([{ recurringId: 'r1', generated: 3 }]);
    mockSyncTasks.mockResolvedValueOnce([{ recurringId: 'rt1', generated: 2 }]);

    const result = await syncRecurringItems('flat-123');

    expect(mockSyncExpenses).toHaveBeenCalledWith('flat-123');
    expect(mockSyncTasks).toHaveBeenCalledWith('flat-123');
    expect(result).toEqual({
      expenses: [{ recurringId: 'r1', generated: 3 }],
      tasks: [{ recurringId: 'rt1', generated: 2 }],
    });
  });

  it('returns empty results for empty flatId', async () => {
    const result = await syncRecurringItems('');
    expect(result).toEqual({ expenses: [], tasks: [] });
  });

  it('handles engine failure gracefully', async () => {
    mockSyncExpenses.mockRejectedValueOnce(new Error('Firestore error'));
    mockSyncTasks.mockResolvedValueOnce([{ recurringId: 'rt1', generated: 1 }]);

    const result = await syncRecurringItems('flat-123');
    expect(result).toEqual({ expenses: [], tasks: [{ recurringId: 'rt1', generated: 1 }] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- __tests__/syncRecurring.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Create the sync utility**

Create `lib/syncRecurring.ts`:

```typescript
import { generateMissingRecurringExpenses } from './recurringExpensesEngine';
import { generateMissingRecurringTasks } from './recurringTasksEngine';
import { logError } from './errorLogger';

export async function syncRecurringItems(flatId: string) {
  if (!flatId) return { expenses: [], tasks: [] };

  const [expensesResult, tasksResult] = await Promise.allSettled([
    generateMissingRecurringExpenses(flatId),
    generateMissingRecurringTasks(flatId),
  ]);

  return {
    expenses: expensesResult.status === 'fulfilled' ? expensesResult.value : [],
    tasks: tasksResult.status === 'fulfilled' ? tasksResult.value : [],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- __tests__/syncRecurring.test.ts`
Expected: All 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/syncRecurring.ts __tests__/syncRecurring.test.ts
git commit -m "feat: add shared syncRecurringItems utility"
```

---

### Task 5: Add firestore rules and indexes

**Files:**
- Modify: `firestore.rules`
- Modify: `firestore.indexes.json`

- [ ] **Step 1: Add recurringTasks collection to firestore.rules**

After the `recurringExpenses` block (around line 49), add:

```
match /recurringTasks/{docId} {
  allow read, update, delete: if tenantRead();
  allow create: if tenantCreate();
}
```

- [ ] **Step 2: Add recurringTasks composite index to firestore.indexes.json**

After the `recurringExpenses` index entry, add:

```json
{
  "collectionGroup": "recurringTasks",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "flatId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add firestore.rules firestore.indexes.json
git commit -m "feat: add firestore rules and indexes for recurringTasks"
```

---

### Task 6: Add translations

**Files:**
- Modify: `context/I18nContext.tsx`

- [ ] **Step 1: Add recurring tasks translation keys to all 3 languages**

After the task-related keys in the English section (around line 351), add:

```typescript
    'tasks.recurringTasks': 'Recurring Tasks',
    'tasks.recurringFormTitle': 'New Recurring Task',
    'tasks.recurringText': 'Task description',
    'tasks.recurringPattern': 'Repeat',
    'tasks.recurringPatternDaily': 'Daily',
    'tasks.recurringPatternWeekly': 'Weekly',
    'tasks.recurringPatternMonthly': 'Monthly',
    'tasks.recurringPatternYearly': 'Yearly',
    'tasks.recurringStartDate': 'Start date',
    'tasks.recurringEndDate': 'End date (optional)',
    'tasks.recurringAddButton': 'Add Recurring Task',
    'tasks.recurringSyncButton': 'Sync Now',
    'tasks.recurringSyncing': 'Syncing...',
    'tasks.recurringNoTemplates': 'No recurring task templates',
    'tasks.recurringNoTemplatesDesc': 'Create a template above and tasks will be auto-generated.',
    'tasks.recurringToastAdded': 'Recurring task template added',
    'tasks.recurringToastDeleted': 'Recurring task template deleted',
    'tasks.recurringToastDeleteFailed': 'Failed to delete recurring template',
    'tasks.recurringToastSyncStarted': 'Syncing recurring items...',
    'tasks.recurringToastSyncComplete': 'Synced! Generated expenses and tasks.',
    'tasks.recurringToastSyncFailed': 'Sync failed. Please try again.',
    'tasks.recurringDeleteConfirm': 'Are you sure you want to delete this recurring task template? Future instances will not be generated.',
    'tasks.tabOneTime': 'One-time',
    'tasks.tabRecurring': 'Recurring',
    'tasks.recurringGenerated': 'Generated',
```

In the Russian section (after line 738), add:

```typescript
    'tasks.recurringTasks': 'Регулярные задачи',
    'tasks.recurringFormTitle': 'Новая регулярная задача',
    'tasks.recurringText': 'Описание задачи',
    'tasks.recurringPattern': 'Повторять',
    'tasks.recurringPatternDaily': 'Ежедневно',
    'tasks.recurringPatternWeekly': 'Еженедельно',
    'tasks.recurringPatternMonthly': 'Ежемесячно',
    'tasks.recurringPatternYearly': 'Ежегодно',
    'tasks.recurringStartDate': 'Дата начала',
    'tasks.recurringEndDate': 'Дата окончания (необязательно)',
    'tasks.recurringAddButton': 'Добавить регулярную задачу',
    'tasks.recurringSyncButton': 'Синхронизировать',
    'tasks.recurringSyncing': 'Синхронизация...',
    'tasks.recurringNoTemplates': 'Нет шаблонов регулярных задач',
    'tasks.recurringNoTemplatesDesc': 'Создайте шаблон выше, и задачи будут создаваться автоматически.',
    'tasks.recurringToastAdded': 'Шаблон регулярной задачи добавлен',
    'tasks.recurringToastDeleted': 'Шаблон регулярной задачи удален',
    'tasks.recurringToastDeleteFailed': 'Не удалось удалить шаблон',
    'tasks.recurringToastSyncStarted': 'Синхронизация...',
    'tasks.recurringToastSyncComplete': 'Синхронизировано! Созданы расходы и задачи.',
    'tasks.recurringToastSyncFailed': 'Ошибка синхронизации. Попробуйте снова.',
    'tasks.recurringDeleteConfirm': 'Вы уверены, что хотите удалить этот шаблон? Будущие задачи не будут создаваться.',
    'tasks.tabOneTime': 'Одноразовые',
    'tasks.tabRecurring': 'Регулярные',
    'tasks.recurringGenerated': 'Создано',
```

In the Uzbek section (after line 1189), add:

```typescript
    'tasks.recurringTasks': 'Takrorlanuvchi vazifalar',
    'tasks.recurringFormTitle': 'Yangi takrorlanuvchi vazifa',
    'tasks.recurringText': 'Vazifa tavsifi',
    'tasks.recurringPattern': 'Takrorlash',
    'tasks.recurringPatternDaily': 'Har kuni',
    'tasks.recurringPatternWeekly': 'Har hafta',
    'tasks.recurringPatternMonthly': 'Har oy',
    'tasks.recurringPatternYearly': 'Har yil',
    'tasks.recurringStartDate': 'Boshlanish sanasi',
    'tasks.recurringEndDate': 'Tugash sanasi (ixtiyoriy)',
    'tasks.recurringAddButton': "Takrorlanuvchi vazifa qo'shish",
    'tasks.recurringSyncButton': 'Yangilash',
    'tasks.recurringSyncing': 'Yangilanmoqda...',
    'tasks.recurringNoTemplates': "Takrorlanuvchi vazifalar yo'q",
    'tasks.recurringNoTemplatesDesc': "Yuqorida shablon yarating, vazifalar avtomatik yaratiladi.",
    'tasks.recurringToastAdded': "Takrorlanuvchi vazifa shabloni qo'shildi",
    'tasks.recurringToastDeleted': "Takrorlanuvchi vazifa shabloni o'chirildi",
    'tasks.recurringToastDeleteFailed': "Shablonni o'chirishda xatolik",
    'tasks.recurringToastSyncStarted': 'Yangilanmoqda...',
    'tasks.recurringToastSyncComplete': "Yangilandi! Xarajatlar va vazifalar yaratildi.",
    'tasks.recurringToastSyncFailed': 'Yangilashda xatolik. Qayta urinib ko\'ring.',
    'tasks.recurringDeleteConfirm': "Haqiqatan ham bu shablonni o'chirmoqchimisiz? Kelajakdagi vazifalar yaratilmaydi.",
    'tasks.tabOneTime': 'Bir martalik',
    'tasks.tabRecurring': 'Takrorlanuvchi',
    'tasks.recurringGenerated': 'Yaratildi',
```

- [ ] **Step 2: Run lint to verify**

Run: `npm run lint`
Expected: Lint passes

- [ ] **Step 3: Commit**

```bash
git add context/I18nContext.tsx
git commit -m "feat: add recurring tasks translations for EN/RU/UZ"
```

---

### Task 7: Update Tasks page with tabs and recurring CRUD

**Files:**
- Modify: `app/dashboard/tasks/page.tsx`

- [ ] **Step 1: Add imports and state for recurring tasks**

In the import section, add:
```typescript
import { Repeat, RefreshCw } from 'lucide-react';
import { syncRecurringItems } from '../../../lib/syncRecurring';
import type { RecurringTask } from '../../../lib/types';
```

Add state variables after existing state:
```typescript
const [activeTab, setActiveTab] = useState<'one-time' | 'recurring'>('one-time');
const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
const [recText, setRecText] = useState('');
const [recAssignedTo, setRecAssignedTo] = useState('');
const [recPriority, setRecPriority] = useState<"low" | "medium" | "high">("medium");
const [recPattern, setRecPattern] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
const [recStartDate, setRecStartDate] = useState('');
const [recEndDate, setRecEndDate] = useState('');
const [syncing, setSyncing] = useState(false);
```

- [ ] **Step 2: Add loadRecurringTasks function and sync effect**

After the existing useEffect, add:
```typescript
const loadRecurringTasks = async () => {
  if (!userProfile?.flatId) return;
  try {
    const snap = await getDocs(query(collection(db, 'recurringTasks'), where('flatId', '==', userProfile.flatId), orderBy('createdAt', 'desc'), limit(200)));
    setRecurringTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecurringTask)));
  } catch (error) {
    logError(error, 'Tasks.loadRecurring');
  }
};

const handleSync = async () => {
  if (!userProfile?.flatId) return;
  setSyncing(true);
  try {
    toast.loading(t('tasks.recurringToastSyncStarted'));
    const result = await syncRecurringItems(userProfile.flatId);
    toast.dismiss();
    const totalGenerated = (result.expenses?.length || 0) + (result.tasks?.length || 0);
    if (totalGenerated > 0) {
      toast.success(t('tasks.recurringToastSyncComplete'));
    } else {
      toast.success(t('tasks.recurringToastSyncComplete'));
    }
  } catch (error) {
    logError(error, 'Tasks.sync');
    toast.error(t('tasks.recurringToastSyncFailed'));
  } finally {
    setSyncing(false);
  }
};

useEffect(() => {
  if (!userProfile?.flatId) return;
  loadRecurringTasks();
  // Auto-sync on mount
  handleSync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [userProfile?.flatId]);
```

- [ ] **Step 3: Add recurring task form handler**

After `handleDelete`, add:
```typescript
const handleAddRecurring = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!recText || !recAssignedTo || !recStartDate) return;
  setAdding(true);
  try {
    await addDoc(collection(db, 'recurringTasks'), {
      flatId: userProfile?.flatId,
      text: recText,
      assignedTo: recAssignedTo,
      priority: recPriority,
      pattern: recPattern,
      startDate: recStartDate,
      endDate: recEndDate || null,
      createdBy: userProfile?.username || '',
      createdAt: new Date().toISOString(),
    });
    setRecText('');
    setRecAssignedTo('');
    setRecPriority('medium');
    setRecPattern('weekly');
    setRecStartDate('');
    setRecEndDate('');
    toast.success(t('tasks.recurringToastAdded'));
    loadRecurringTasks();
  } catch (error) {
    logError(error, 'Tasks.addRecurring');
    toast.error(t('tasks.toast.addFailed'));
  } finally {
    setAdding(false);
  }
};

const handleDeleteRecurring = async (id: string) => {
  setConfirmState({
    open: true,
    onConfirm: async () => {
      try {
        await deleteDoc(doc(db, 'recurringTasks', id));
        toast.success(t('tasks.recurringToastDeleted'));
        loadRecurringTasks();
      } catch (error) {
        logError(error, 'Tasks.deleteRecurring');
        toast.error(t('tasks.recurringToastDeleteFailed'));
      }
    },
    message: t('tasks.recurringDeleteConfirm'),
  });
};
```

- [ ] **Step 4: Add tab UI and recurring content to the return JSX**

Replace the section after `<div className="max-w-3xl mx-auto space-y-6">` with:

```tsx
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-[#2A1E00] border border-[#F0D89A] dark:border-[#3D2E00] rounded-xl p-1">
          <button
            onClick={() => setActiveTab('one-time')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
              activeTab === 'one-time'
                ? 'bg-[#F97316] text-white shadow-sm'
                : 'text-[#6b7280] dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-gray-200'
            }`}
          >
            {t('tasks.tabOneTime')}
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
              activeTab === 'recurring'
                ? 'bg-[#F97316] text-white shadow-sm'
                : 'text-[#6b7280] dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-gray-200'
            }`}
          >
            {t('tasks.tabRecurring')}
          </button>
        </div>

        {activeTab === 'one-time' ? (
          /* Existing one-time task form + list */
          <>
            {/* Add Task Form (existing) */}
            <div className="bg-white dark:bg-[#2A1E00] border border-[#F0D89A] dark:border-[#3D2E00] rounded-xl p-6">
              ...
            </div>

            {/* Task List (existing) */}
            <div className="bg-white dark:bg-gray-800 border border-[#e5e7eb] dark:border-gray-700 rounded-xl p-6">
              ...
            </div>
          </>
        ) : (
          /* Recurring Tasks tab */
          <>
            {/* Add Recurring Task Form */}
            <div className="bg-white dark:bg-[#2A1E00] border border-[#F0D89A] dark:border-[#3D2E00] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-[#0a0a0a] dark:text-gray-100">{t('tasks.recurringFormTitle')}</h3>
              <form onSubmit={handleAddRecurring} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('tasks.recurringText')}</label>
                  <input
                    type="text"
                    value={recText}
                    onChange={(e) => setRecText(e.target.value)}
                    maxLength={200}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('tasks.assignTo')}</label>
                    <select
                      value={recAssignedTo}
                      onChange={(e) => setRecAssignedTo(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                      required
                    >
                      <option value="">{t('tasks.select')}</option>
                      {users.map((u) => (
                        <option key={u.username} value={u.username}>{u.name || u.username}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('tasks.priority')}</label>
                    <select
                      value={recPriority}
                      onChange={(e) => setRecPriority(e.target.value as "low" | "medium" | "high")}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    >
                      <option value="low">{t('tasks.priorityLow')}</option>
                      <option value="medium">{t('tasks.priorityMedium')}</option>
                      <option value="high">{t('tasks.priorityHigh')}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('tasks.recurringPattern')}</label>
                    <select
                      value={recPattern}
                      onChange={(e) => setRecPattern(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    >
                      <option value="daily">{t('tasks.recurringPatternDaily')}</option>
                      <option value="weekly">{t('tasks.recurringPatternWeekly')}</option>
                      <option value="monthly">{t('tasks.recurringPatternMonthly')}</option>
                      <option value="yearly">{t('tasks.recurringPatternYearly')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('tasks.recurringStartDate')}</label>
                    <input
                      type="date"
                      value={recStartDate}
                      onChange={(e) => setRecStartDate(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('tasks.recurringEndDate')}</label>
                    <input
                      type="date"
                      value={recEndDate}
                      onChange={(e) => setRecEndDate(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-[#0a0a0a] dark:bg-gray-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {adding && <Spinner />}
                  <Repeat size={16} />
                  {t('tasks.recurringAddButton')}
                </button>
              </form>
            </div>

            {/* Recurring Templates List */}
            <div className="bg-white dark:bg-gray-800 border border-[#e5e7eb] dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-gray-100">{t('tasks.recurringTasks')}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[#6b7280] dark:text-gray-300 text-xs font-medium">
                    {recurringTasks.length}
                  </span>
                </div>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-3 py-1.5 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#e06610] transition disabled:opacity-60 inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? t('tasks.recurringSyncing') : t('tasks.recurringSyncButton')}
                </button>
              </div>

              {recurringTasks.length === 0 ? (
                <EmptyState
                  emoji="🔄"
                  title={t('tasks.recurringNoTemplates')}
                  description={t('tasks.recurringNoTemplatesDesc')}
                />
              ) : (
                <div className="space-y-2">
                  {recurringTasks.map((rt) => (
                    <div
                      key={rt.id}
                      className="flex items-center gap-3 py-3 border-b border-[#f3f4f6] dark:border-gray-700 last:border-b-0"
                    >
                      <Repeat size={16} className="text-[#F97316] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[#0a0a0a] dark:text-gray-100">{rt.text}</div>
                        <div className="text-xs text-[#6b7280] dark:text-gray-400 mt-0.5 flex items-center gap-2">
                          {users.find((u) => u.username === rt.assignedTo)?.name || rt.assignedTo}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            {t(`tasks.recurringPattern${rt.pattern.charAt(0).toUpperCase() + rt.pattern.slice(1)}` as any)}
                          </span>
                          {rt.lastGeneratedDate && (
                            <span className="text-gray-400">
                              {t('tasks.recurringGenerated')}: {rt.lastGeneratedDate}
                            </span>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => rt.id && handleDeleteRecurring(rt.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Delete recurring task"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
```

This is a large change. The exact implementation needs to carefully preserve the existing one-time task form and list (lines 161-363 of the current file) inside the `activeTab === 'one-time'` branch.

- [ ] **Step 5: Run build to verify**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/tasks/page.tsx
git commit -m "feat: add recurring tasks tab with CRUD and sync on tasks page"
```

---

### Task 8: Wire up sync on Expenses page

**Files:**
- Modify: `app/dashboard/expenses/page.tsx`

- [ ] **Step 1: Add sync import and button**

Add import:
```typescript
import { RefreshCw } from 'lucide-react';
import { syncRecurringItems } from '../../../lib/syncRecurring';
```

Add state:
```typescript
const [syncingRecurring, setSyncingRecurring] = useState(false);
```

Add sync handler after existing handlers:
```typescript
const handleSyncRecurring = async () => {
  if (!userProfile?.flatId) return;
  setSyncingRecurring(true);
  try {
    await syncRecurringItems(userProfile.flatId);
    toast.success(t('expenses.toast.syncComplete') || 'Recurring items synced');
  } catch (error) {
    logError(error, 'Expenses.syncRecurring');
    toast.error(t('expenses.toast.syncFailed') || 'Sync failed');
  } finally {
    setSyncingRecurring(false);
  }
};
```

Call `handleSyncRecurring()` on mount in the existing useEffect (line 202-206):
```typescript
useEffect(() => {
  if (!userProfile?.flatId) return;
  loadRecurringExpenses();
  handleSyncRecurring();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [userProfile]);
```

Add sync button next to the header download button (around line 439):
```tsx
<button
  onClick={handleSyncRecurring}
  disabled={syncingRecurring}
  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
>
  <RefreshCw className={`w-5 h-5 ${syncingRecurring ? 'animate-spin' : ''}`} />
</button>
```

- [ ] **Step 2: Run build to verify**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/expenses/page.tsx
git commit -m "feat: wire up recurring sync on expenses page"
```

---

### Task 9: Update i18n test

**Files:**
- Modify: `__tests__/I18nContext.test.tsx`

- [ ] **Step 1: Add test for recurring task translations**

After the existing `tasks.status` test block, add:

```typescript
    it('has tasks.recurringPattern translations in all three languages', () => {
      const { result } = renderHook(() => useI18n(), { wrapper });

      act(() => result.current.setLanguage('en'));
      expect(result.current.t('tasks.recurringPatternDaily')).toBe('Daily');

      act(() => result.current.setLanguage('ru'));
      expect(result.current.t('tasks.recurringPatternDaily')).toBe('Ежедневно');

      act(() => result.current.setLanguage('uz'));
      expect(result.current.t('tasks.recurringPatternDaily')).toBe('Har kuni');
    });
```

- [ ] **Step 2: Run the i18n test**

Run: `npm run test -- __tests__/I18nContext.test.tsx -t "recurringPattern"`
Expected: Tests pass

- [ ] **Step 3: Run all tests**

Run: `npm run test`
Expected: All 103+ tests pass (new tests added)

- [ ] **Step 4: Commit**

```bash
git add __tests__/I18nContext.test.tsx
git commit -m "test: add i18n test for recurring task translations"
```

---

### Task 10: Final verification

- [ ] **Step 1: Run full test suite**

Run: `npm run test`
Expected: All tests pass

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: final verification passing"
```
