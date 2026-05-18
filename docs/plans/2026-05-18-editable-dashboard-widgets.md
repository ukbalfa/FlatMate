# Editable Dashboard Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) for syntax tracking.

**Goal:** Turn the 7 hardcoded dashboard sections into per-user draggable, removable, addable widgets stored in localStorage.

**Architecture:** A `useDashboardWidgets` hook manages widget order/visibility in localStorage. A widget registry maps IDs to components. The dashboard page keeps all Firestore listeners and passes data down as props. Each section is extracted into its own file under `app/dashboard/components/widgets/`. dnd-kit handles drag-and-reorder within each column. Edit mode toggles show/hide of drag handles and remove buttons.

**Tech Stack:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, Framer Motion (already in project), localStorage

---

### Task 1: Install dnd-kit dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dnd-kit packages**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: 3 packages installed, no errors

- [ ] **Step 2: Verify TypeScript**

```bash
npm run typecheck
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @dnd-kit dependencies for dashboard widget drag-and-drop"
```

---

### Task 2: Create `useDashboardWidgets` hook with tests

**Files:**
- Create: `lib/hooks/useDashboardWidgets.ts`
- Create: `__tests__/useDashboardWidgets.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/useDashboardWidgets.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDashboardWidgets } from '../lib/hooks/useDashboardWidgets';

const ALL = ['stats','quickActions','activity','rentCountdown','tasks','cleaning','monthlySummary'];

describe('useDashboardWidgets', () => {
  let mock: Record<string, string>;

  beforeEach(() => {
    mock = {};
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((k) => mock[k] ?? null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => { mock[k] = v; });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((k) => { delete mock[k]; });
  });

  afterEach(() => { jest.restoreAllMocks(); });

  it('returns default order when no localStorage entry exists', () => {
    const { result } = renderHook(() => useDashboardWidgets());
    expect(result.current.visibleWidgets).toEqual(ALL);
  });

  it('hiddenWidgets is complement of visibleWidgets', () => {
    const { result } = renderHook(() => useDashboardWidgets());
    expect(result.current.hiddenWidgets).toEqual([]);
  });

  it('removeWidget moves id from visible to hidden', () => {
    const { result } = renderHook(() => useDashboardWidgets());
    act(() => result.current.removeWidget('cleaning'));
    expect(result.current.visibleWidgets).not.toContain('cleaning');
    expect(result.current.hiddenWidgets).toContain('cleaning');
  });

  it('addWidget restores hidden widget at end of visible', () => {
    const { result } = renderHook(() => useDashboardWidgets());
    act(() => result.current.removeWidget('cleaning'));
    act(() => result.current.addWidget('cleaning'));
    expect(result.current.visibleWidgets).toEqual(ALL);
    expect(result.current.hiddenWidgets).toEqual([]);
  });

  it('reorderWidgets swaps items at given indices', () => {
    const { result } = renderHook(() => useDashboardWidgets());
    act(() => result.current.reorderWidgets(0, 1));
    expect(result.current.visibleWidgets[0]).toBe('quickActions');
    expect(result.current.visibleWidgets[1]).toBe('stats');
  });

  it('save persists current state to localStorage', () => {
    const { result } = renderHook(() => useDashboardWidgets());
    act(() => result.current.removeWidget('tasks'));
    act(() => result.current.save());
    const saved = JSON.parse(mock['dashboard_widgets']);
    expect(saved.visibleWidgets).not.toContain('tasks');
  });

  it('removeWidget on already-hidden is no-op', () => {
    const { result } = renderHook(() => useDashboardWidgets());
    act(() => result.current.removeWidget('cleaning'));
    act(() => result.current.removeWidget('cleaning'));
    expect(result.current.hiddenWidgets).toEqual(['cleaning']);
  });

  it('addWidget on already-visible is no-op', () => {
    const { result } = renderHook(() => useDashboardWidgets());
    act(() => result.current.addWidget('cleaning'));
    expect(result.current.visibleWidgets).toEqual(ALL);
  });

  it('removing all makes every widget hidden', () => {
    const { result } = renderHook(() => useDashboardWidgets());
    act(() => { ALL.forEach((id) => result.current.removeWidget(id)); });
    expect(result.current.visibleWidgets).toEqual([]);
    expect(result.current.hiddenWidgets).toEqual(ALL);
  });

  it('resetToDefaults restores all in default order', () => {
    const { result } = renderHook(() => useDashboardWidgets());
    act(() => { result.current.removeWidget('stats'); result.current.reorderWidgets(0, 2); });
    act(() => result.current.resetToDefaults());
    expect(result.current.visibleWidgets).toEqual(ALL);
    expect(result.current.hiddenWidgets).toEqual([]);
  });

  it('silently filters unknown widget IDs from localStorage', () => {
    mock['dashboard_widgets'] = JSON.stringify({ visibleWidgets: ['stats','nonexistent','tasks'] });
    const { result } = renderHook(() => useDashboardWidgets());
    expect(result.current.visibleWidgets).toEqual(['stats', 'tasks']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test -- __tests__/useDashboardWidgets.test.ts
```

Expected: FAIL — "useDashboardWidgets not defined"

- [ ] **Step 3: Implement the hook**

```ts
// lib/hooks/useDashboardWidgets.ts
'use client';
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'dashboard_widgets';

const ALL_WIDGETS = [
  'stats', 'quickActions', 'activity', 'rentCountdown',
  'tasks', 'cleaning', 'monthlySummary',
] as const;

export type WidgetId = (typeof ALL_WIDGETS)[number];

interface WidgetConfig {
  visibleWidgets: WidgetId[];
}

function defaults(): WidgetConfig {
  return { visibleWidgets: [...ALL_WIDGETS] };
}

function read(): WidgetConfig {
  if (typeof window === 'undefined') return defaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as WidgetConfig;
    const filtered = parsed.visibleWidgets.filter((id): id is WidgetId =>
      ALL_WIDGETS.includes(id as WidgetId)
    );
    return { visibleWidgets: filtered };
  } catch {
    return defaults();
  }
}

export function useDashboardWidgets() {
  const [config, setConfig] = useState<WidgetConfig>(read);

  const visibleWidgets = config.visibleWidgets;
  const hiddenWidgets = ALL_WIDGETS.filter((id) => !config.visibleWidgets.includes(id));

  const save = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const removeWidget = useCallback((id: WidgetId) => {
    setConfig((prev) => ({
      visibleWidgets: prev.visibleWidgets.filter((w) => w !== id),
    }));
  }, []);

  const addWidget = useCallback((id: WidgetId) => {
    setConfig((prev) => {
      if (prev.visibleWidgets.includes(id)) return prev;
      return { visibleWidgets: [...prev.visibleWidgets, id] };
    });
  }, []);

  const reorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    setConfig((prev) => {
      const next = [...prev.visibleWidgets];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      return { visibleWidgets: next };
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(defaults());
  }, []);

  return { visibleWidgets, hiddenWidgets, removeWidget, addWidget, reorderWidgets, save, resetToDefaults };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- __tests__/useDashboardWidgets.test.ts
```

Expected: PASS — all 12 tests

- [ ] **Step 5: Run full test suite**

```bash
npm run test
```

Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add lib/hooks/useDashboardWidgets.ts __tests__/useDashboardWidgets.test.ts
git commit -m "feat: add useDashboardWidgets hook with localStorage persistence"
```

---

### Task 3: Create DashboardWidget wrapper component

**Files:**
- Create: `app/dashboard/components/DashboardWidget.tsx`

- [ ] **Step 1: Create the wrapper component**

```tsx
// app/dashboard/components/DashboardWidget.tsx
'use client';
import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardWidgetProps {
  id: string;
  children: ReactNode;
  editing: boolean;
  onRemove?: () => void;
}

export default function DashboardWidget({ id, children, editing, onRemove }: DashboardWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1, opacity: isDragging ? 0.5 : 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="relative"
    >
      {children}
      {editing && <div className="absolute inset-0 rounded-[2rem] ring-2 ring-accent/40 ring-inset pointer-events-none z-10" />}
      {editing && (
        <button
          {...attributes} {...listeners}
          className="absolute top-3 left-3 z-20 p-1.5 rounded-lg bg-accent text-white cursor-grab active:cursor-grabbing hover:bg-accent-hover transition-colors"
          aria-label="Drag widget"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      {editing && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
          aria-label="Remove widget"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/components/DashboardWidget.tsx
git commit -m "feat: create DashboardWidget drag-and-drop wrapper component"
```

---

### Task 4: Create AddWidgetPanel component

**Files:**
- Create: `app/dashboard/components/AddWidgetPanel.tsx`

- [ ] **Step 1: Create the add widget panel**

```tsx
// app/dashboard/components/AddWidgetPanel.tsx
'use client';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import type { WidgetId } from '@/lib/hooks/useDashboardWidgets';

const LABELS: Record<WidgetId, string> = {
  stats: 'Stats Grid', quickActions: 'Quick Actions', activity: 'Activity Feed',
  rentCountdown: 'Rent Countdown', tasks: 'My Tasks', cleaning: 'Cleaning Schedule',
  monthlySummary: 'Monthly Summary',
};

interface AddWidgetPanelProps {
  hiddenWidgets: WidgetId[];
  onAdd: (id: WidgetId) => void;
  open: boolean;
  onClose: () => void;
}

export default function AddWidgetPanel({ hiddenWidgets, onAdd, open, onClose }: AddWidgetPanelProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-80 max-w-[90vw] bg-[#0A0A0A] border-l border-white/10 h-full overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white font-space-grotesk">Add Widget</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50">
            <X className="w-5 h-5" />
          </button>
        </div>
        {hiddenWidgets.length === 0 ? (
          <p className="text-white/40 text-sm font-dm-sans">All widgets are already on your dashboard.</p>
        ) : (
          <div className="space-y-2">
            {hiddenWidgets.map((id) => (
              <button
                key={id} onClick={() => onAdd(id)}
                className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-left group"
              >
                <span className="flex-1 text-sm font-bold text-white font-dm-sans">{LABELS[id]}</span>
                <Plus className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/components/AddWidgetPanel.tsx
git commit -m "feat: create AddWidgetPanel slide-in drawer for hidden widgets"
```

---

### Task 5: Extract all 7 widget components

**Files:**
- Create: `app/dashboard/components/widgets/StatsWidget.tsx`
- Create: `app/dashboard/components/widgets/QuickActionsWidget.tsx`
- Create: `app/dashboard/components/widgets/ActivityWidget.tsx`
- Create: `app/dashboard/components/widgets/RentCountdownWidget.tsx`
- Create: `app/dashboard/components/widgets/TasksWidget.tsx`
- Create: `app/dashboard/components/widgets/CleaningWidget.tsx`
- Create: `app/dashboard/components/widgets/MonthlySummaryWidget.tsx`

Each widget receives the data it needs as props from the parent page (which keeps all Firestore listeners). Extract the exact rendering code from `app/dashboard/page.tsx` and wrap in a named export interface.

- [ ] **Step 1: Create `StatsWidget.tsx`**

The stats grid (currently lines 270-302 in dashboard page). Props: `{ stats: Array<{title, value, subtitle, icon, color, trend, alert?}>, loading?: boolean }`. Renders 4 stat cards in a responsive grid.

- [ ] **Step 2: Create `QuickActionsWidget.tsx`**

The quick actions area (currently lines 309-353). Props: `{ t: (key: string, params?: any) => string }`. Renders 4 action links with icons.

- [ ] **Step 3: Create `ActivityWidget.tsx`**

The activity feed (currently lines 356-418). Props: `{ activityFeed: ActivityItem[], t }`. Renders the list with `EmptyState` fallback.

- [ ] **Step 4: Create `RentCountdownWidget.tsx`**

Wrapper around existing `app/components/RentCountdown.tsx`. No props needed (RentCountdown fetches its own data). Simply renders `<RentCountdown />` inside the card shell.

```tsx
// app/dashboard/components/widgets/RentCountdownWidget.tsx
'use client';
import dynamic from 'next/dynamic';
const RentCountdown = dynamic(() => import('../../components/RentCountdown'), { ssr: false });
export default function RentCountdownWidget() {
  return <RentCountdown />;
}
```

- [ ] **Step 5: Create `TasksWidget.tsx`**

My tasks section (currently lines 429-499). Props: `{ myTasks: Task[], t }`. Filters/showcases tasks with overdue/today badges.

- [ ] **Step 6: Create `CleaningWidget.tsx`**

Cleaning schedule section (currently lines 502-551). Props: `{ myCleaning: CleaningTask[], t }`. Shows cleaning tasks with day badges.

- [ ] **Step 7: Create `MonthlySummaryWidget.tsx`**

Monthly overview section (currently lines 554-607). Props: `{ myMonthExpenses: number, totalMonthExpenses: number, t }`. Shows contribution bar + links.

- [ ] **Step 8: Commit all widget files**

```bash
git add app/dashboard/components/widgets/
git commit -m "feat: extract all 7 dashboard sections into widget components"
```

---

### Task 6: Refactor dashboard page to use widget system

**Files:**
- Modify: `app/dashboard/page.tsx` (entire file replaced)

- [ ] **Step 1: Replace dashboard page content**

`app/dashboard/page.tsx` keeps the 4 Firestore subscriptions and derived data computation. The rendering section switches from hardcoded sections to `visibleWidgets`-driven rendering with `DndContext` + `SortableContext`.

```tsx
// app/dashboard/page.tsx (replacement)
'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { Pencil, Check, Plus, Wallet, CheckSquare, Sparkles, Users } from 'lucide-react';
import { SkeletonCard } from '../components/Skeleton';
import DashboardWidget from '../components/DashboardWidget';
import AddWidgetPanel from '../components/AddWidgetPanel';
import { useDashboardWidgets, type WidgetId } from '../../lib/hooks/useDashboardWidgets';
import StatsWidget from '../components/widgets/StatsWidget';
import QuickActionsWidget from '../components/widgets/QuickActionsWidget';
import ActivityWidget from '../components/widgets/ActivityWidget';
import RentCountdownWidget from '../components/widgets/RentCountdownWidget';
import TasksWidget from '../components/widgets/TasksWidget';
import CleaningWidget from '../components/widgets/CleaningWidget';
import MonthlySummaryWidget from '../components/widgets/MonthlySummaryWidget';
import { getMonday } from '../../lib/utils';
import type { Expense, Task, CleaningTask, Roommate, ActivityItem } from '../../lib/types';

// Widget column assignment for layout
const WIDGET_COLUMN: Record<WidgetId, 'left' | 'right'> = {
  stats: 'left', quickActions: 'left', activity: 'left',
  rentCountdown: 'right', tasks: 'right', cleaning: 'right', monthlySummary: 'right',
};

export default function DashboardPage() {
  const { userProfile, setShowFlatModal } = useAuth();
  const { t } = useI18n();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [users, setUsers] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [currentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const { visibleWidgets, hiddenWidgets, removeWidget, addWidget, reorderWidgets, save } = useDashboardWidgets();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const allIds = [...visibleWidgets];
    const oldIndex = allIds.indexOf(active.id as WidgetId);
    const newIndex = allIds.indexOf(over.id as WidgetId);
    if (oldIndex !== -1 && newIndex !== -1) reorderWidgets(oldIndex, newIndex);
  }, [visibleWidgets, reorderWidgets]);

  // ---- Firestore listeners ----
  useEffect(() => {
    if (!userProfile?.flatId) { setLoading(false); return; }
    const weekStart = getMonday(new Date());
    const unsubs: (() => void)[] = [];
    let loadedCount = 0;
    const loaded = () => { loadedCount++; if (loadedCount >= 4) setLoading(false); };
    setLoading(true);

    unsubs.push(onSnapshot(
      query(collection(db, 'expenses'), where('flatId', '==', userProfile.flatId), orderBy('date', 'desc'), limit(50)),
      (snap) => { setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense))); loaded(); }
    ));
    unsubs.push(onSnapshot(
      query(collection(db, 'tasks'), where('flatId', '==', userProfile.flatId), orderBy('dueDate', 'desc'), limit(100)),
      (snap) => { setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task))); loaded(); }
    ));
    unsubs.push(onSnapshot(
      query(collection(db, 'cleaning'), where('flatId', '==', userProfile.flatId), where('weekStart', '==', weekStart)),
      (snap) => { setCleaningTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CleaningTask))); loaded(); }
    ));
    unsubs.push(onSnapshot(
      query(collection(db, 'users'), where('flatId', '==', userProfile.flatId), orderBy('createdAt', 'desc')),
      (snap) => { setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Roommate))); loaded(); }
    ));
    return () => unsubs.forEach((u) => u());
  }, [userProfile?.flatId]);

  // ---- Derived data ----
  const activityFeed = useMemo(() => {
    const items: ActivityItem[] = [];
    expenses.slice(0, 10).forEach((e) => items.push({
      id: `exp-${e.id}`, type: 'expense',
      title: t('dashboard.expenseAdded', { category: e.category }),
      description: t('dashboard.paidAmount', { paidBy: e.paidBy, amount: e.amount.toLocaleString() }),
      timestamp: e.date, amount: e.amount, user: e.paidBy,
    }));
    const todayDate = new Date().toISOString().slice(0, 10);
    tasks.filter((t) => !t.done && t.dueDate >= todayDate).slice(0, 5).forEach((tk) => {
      const days = Math.ceil((new Date(tk.dueDate).getTime() - Date.now()) / 86400000);
      items.push({
        id: `task-${tk.id}`, type: 'task',
        title: t('dashboard.taskDueSoon'),
        description: `"${tk.text}" ${t('dashboard.assignedTo')} ${tk.assignedTo} (${days === 0 ? t('common.today') : t('dashboard.daysRemaining', { days })})`,
        timestamp: tk.dueDate, user: tk.assignedTo,
      });
    });
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items.slice(0, 15);
  }, [expenses, tasks, t]);

  const mexp = expenses.filter((e) => e.date.startsWith(currentMonth));
  const totalMonthExpenses = mexp.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const myMonthExpenses = mexp.filter((e) => e.paidBy === userProfile?.username).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const myTasks = tasks.filter((t) => t.assignedTo === userProfile?.username && !t.done);
  const myCleaning = cleaningTasks.filter((c) => c.assignedTo === userProfile?.username && !c.done);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const overdueCount = myTasks.filter((t) => new Date(t.dueDate) < new Date(new Date().toISOString().slice(0, 10))).length;
  const todayCleaningCount = myCleaning.filter((c) => c.dayOfWeek === today).length;

  const stats = [
    { title: t('dashboard.thisMonthExpenses'), value: totalMonthExpenses.toLocaleString() + ' UZS', subtitle: t('dashboard.totalExpenses'), icon: Wallet, color: 'bg-accent', trend: myMonthExpenses > 0 ? t('dashboard.youPaid') + ' ' + myMonthExpenses.toLocaleString() : null },
    { title: t('dashboard.myTasks'), value: myTasks.length.toString(), subtitle: `${overdueCount} ${t('dashboard.overdue')}`, icon: CheckSquare, color: overdueCount > 0 ? 'bg-red-500' : 'bg-blue-500', alert: overdueCount > 0 },
    { title: t('dashboard.cleaning'), value: myCleaning.length.toString(), subtitle: todayCleaningCount > 0 ? `${todayCleaningCount} ${t('dashboard.today')}` : t('dashboard.thisWeek'), icon: Sparkles, color: todayCleaningCount > 0 ? 'bg-amber-500' : 'bg-purple-500', alert: todayCleaningCount > 0 },
    { title: t('dashboard.roommates'), value: users.length.toString(), subtitle: t('dashboard.activeMembers'), icon: Users, color: 'bg-teal-500' },
  ];

  const leftWidgets = visibleWidgets.filter((id) => WIDGET_COLUMN[id] === 'left');
  const rightWidgets = visibleWidgets.filter((id) => WIDGET_COLUMN[id] === 'right');

  function renderWidget(id: WidgetId) {
    switch (id) {
      case 'stats': return <StatsWidget stats={stats} loading={loading} />;
      case 'quickActions': return <QuickActionsWidget t={t} />;
      case 'activity': return <ActivityWidget activityFeed={activityFeed} t={t} />;
      case 'rentCountdown': return <RentCountdownWidget />;
      case 'tasks': return <TasksWidget myTasks={myTasks} t={t} />;
      case 'cleaning': return <CleaningWidget myCleaning={myCleaning} t={t} />;
      case 'monthlySummary': return <MonthlySummaryWidget myMonthExpenses={myMonthExpenses} totalMonthExpenses={totalMonthExpenses} t={t} />;
    }
  }

  const handleDone = useCallback(() => { setEditing(false); save(); }, [save]);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-space-grotesk font-bold text-white tracking-tight"
              >
                {t('dashboard.welcome')}, <span className="text-transparent bg-clip-text bg-gradient-citrus">{userProfile?.name || userProfile?.username}</span>!
              </motion.h1>
              <p className="text-white/50 mt-3 font-dm-sans text-lg">{t('dashboard.monthlyOverview')}</p>
            </div>
            <button
              onClick={() => editing ? handleDone() : setEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                editing ? 'bg-accent text-white hover:bg-accent-hover' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {editing ? <><Check className="w-4 h-4" /> Done</> : <><Pencil className="w-4 h-4" /> Edit Dashboard</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6"><SkeletonCard /><SkeletonCard /></div>
              <div className="space-y-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
            </div>
          </div>
        ) : (
          <>
            {!userProfile?.flatId && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-md bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-center justify-between"
              >
                <div>
                  <p className="text-amber-400 font-medium">You&apos;re not in a flat yet</p>
                  <p className="text-gray-400 text-sm">Set up your flat to start tracking expenses and chores with your roommates.</p>
                </div>
                <button onClick={() => setShowFlatModal(true)}
                  className="bg-amber-400 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-amber-300 transition text-sm whitespace-nowrap"
                >Set up your flat</button>
              </motion.div>
            )}

            {visibleWidgets.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-white/50 mb-4 font-space-grotesk">Your dashboard is empty</p>
                <p className="text-sm text-white/30 mb-6 font-dm-sans">Add widgets to get started</p>
                <button onClick={() => setAddPanelOpen(true)}
                  className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-bold hover:bg-accent-hover transition-colors"
                ><Plus className="w-5 h-5" /> Add Widget</button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <SortableContext items={leftWidgets} strategy={verticalListSortingStrategy}>
                      <AnimatePresence mode="popLayout">
                        {leftWidgets.map((id) => (
                          <DashboardWidget key={id} id={id} editing={editing} onRemove={() => removeWidget(id)}>
                            {renderWidget(id)}
                          </DashboardWidget>
                        ))}
                      </AnimatePresence>
                    </SortableContext>
                  </div>
                  <div className="space-y-6">
                    <SortableContext items={rightWidgets} strategy={verticalListSortingStrategy}>
                      <AnimatePresence mode="popLayout">
                        {rightWidgets.map((id) => (
                          <DashboardWidget key={id} id={id} editing={editing} onRemove={() => removeWidget(id)}>
                            {renderWidget(id)}
                          </DashboardWidget>
                        ))}
                      </AnimatePresence>
                    </SortableContext>
                  </div>
                </div>
              </DndContext>
            )}

            {editing && hiddenWidgets.length > 0 && (
              <div className="mt-6 text-center">
                <button onClick={() => setAddPanelOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-dashed border-white/20 transition-all"
                ><Plus className="w-4 h-4" /> Add Widget ({hiddenWidgets.length})</button>
              </div>
            )}

            <AddWidgetPanel hiddenWidgets={hiddenWidgets} onAdd={addWidget} open={addPanelOpen} onClose={() => setAddPanelOpen(false)} />
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

```bash
npm run build
```

Expected: Build succeeds (you may need to fix import paths for widgets — adjust `../../` depth as needed depending on actual file locations)

- [ ] **Step 3: Run full test suite**

```bash
npm run test
```

Expected: All tests pass (existing tests + new widget hook tests)

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: refactor dashboard page to use widget system with drag-and-drop"
```

---

### Task 7: Verify end-to-end

**Files:**
- N/A (verification only)

- [ ] **Step 1: Start dev server and quick visual check**

```bash
npm run dev
```

Navigate to `/dashboard`. Confirm:
- All 7 widgets render in default layout
- "Edit Dashboard" button appears
- Clicking "Edit Dashboard" shows drag handles + remove buttons
- Removing a widget hides it
- Add Widget panel shows hidden widgets
- Adding a widget restores it
- "Done" saves to localStorage
- Refreshing page preserves widget order
- Resetting localStorage (clear `dashboard_widgets`) restores defaults

- [ ] **Step 2: Verify localStorage persistence**

Open browser console and run:
```js
localStorage.getItem('dashboard_widgets')
```
Should show JSON with current widget order after edit mode save.

- [ ] **Step 3: Final verification**

```bash
npm run lint && npm run build && npm run test
```

Expected: All pass

```bash
git log --oneline -5
git status
```

Expected: Clean working tree with 7 commits
