'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { Pencil, Check, Plus, Wallet, CheckSquare, Sparkles, Users } from 'lucide-react';
import { SkeletonCard } from '../components/Skeleton';
import { useDashboardWidgets, type WidgetId } from '@/lib/hooks/useDashboardWidgets';
import DashboardWidget from './components/DashboardWidget';
import AddWidgetPanel from './components/AddWidgetPanel';
import StatsWidget from './components/widgets/StatsWidget';
import QuickActionsWidget from './components/widgets/QuickActionsWidget';
import ActivityWidget from './components/widgets/ActivityWidget';
import RentCountdownWidget from './components/widgets/RentCountdownWidget';
import TasksWidget from './components/widgets/TasksWidget';
import CleaningWidget from './components/widgets/CleaningWidget';
import MonthlySummaryWidget from './components/widgets/MonthlySummaryWidget';
import { getMonday } from '@/lib/utils';
import type { Expense, Task, CleaningTask, Roommate, ActivityItem } from '@/lib/types';

const WIDGET_COLUMN: Record<WidgetId, 'left' | 'right'> = {
  stats: 'left', quickActions: 'left', activity: 'left',
  rentCountdown: 'right', tasks: 'right', cleaning: 'right', monthlySummary: 'right',
};

export default function DashboardPage() {
  const { userProfile, setShowFlatModal } = useAuth();
  const { t: _t } = useI18n();
  const t = _t as (key: string, params?: Record<string, unknown>) => string;
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

  const activityFeed = useMemo(() => {
    const items: ActivityItem[] = [];
    expenses.slice(0, 10).forEach((e) => items.push({
      id: `exp-${e.id}`, type: 'expense',
      title: t('dashboard.expenseAdded', { category: e.category }),
      description: t('dashboard.paidAmount', { paidBy: e.paidBy, amount: e.amount.toLocaleString() }),
      timestamp: e.date, amount: e.amount, user: e.paidBy,
    }));
    const todayDate = new Date().toISOString().slice(0, 10);
    tasks.filter((tk) => !tk.done && tk.dueDate >= todayDate).slice(0, 5).forEach((tk) => {
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
  const myTasks = tasks.filter((tk) => tk.assignedTo === userProfile?.username && !tk.done);
  const myCleaning = cleaningTasks.filter((c) => c.assignedTo === userProfile?.username && !c.done);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const overdueCount = myTasks.filter((tk) => new Date(tk.dueDate) < new Date(new Date().toISOString().slice(0, 10))).length;
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
      case 'stats': return <StatsWidget stats={stats} />;
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
