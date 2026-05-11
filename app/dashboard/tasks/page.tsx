'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { Trash2, Repeat, RefreshCw } from 'lucide-react';
import { Spinner } from '../../components/Spinner';
import { SkeletonList } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import { useNotifications } from '../../../context/NotificationsContext';
import { logError } from '../../../lib/errorLogger';
import type { Roommate, Task, RecurringTask } from '../../../lib/types';
import { syncRecurringItems } from '../../../lib/syncRecurring';



export default function TasksPage() {
  const { userProfile } = useAuth();
  const { t } = useI18n();
  const { createNotification } = useNotifications();

  const getBadgeLabel = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    if (due > today) return t('tasks.status.upcoming');
    if (due.getTime() === today.getTime()) return t('tasks.status.today');
    return t('tasks.status.overdue');
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<Roommate[]>([]);
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<"medium" | "low" | "high">("medium");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [activeTab, setActiveTab] = useState<'one-time' | 'recurring'>('one-time');
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [recText, setRecText] = useState('');
  const [recAssignedTo, setRecAssignedTo] = useState('');
  const [recPriority, setRecPriority] = useState<"low" | "medium" | "high">("medium");
  const [recPattern, setRecPattern] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [recStartDate, setRecStartDate] = useState('');
  const [recEndDate, setRecEndDate] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!userProfile?.flatId) return;

    const loadUsers = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('flatId', '==', userProfile!.flatId), orderBy('createdAt', 'desc')));
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Roommate)));
      } catch (error) {
        logError(error, 'Tasks.fetchUsers');
        toast.error(t('tasks.toast.loadUsersFailed'));
      }
    };

    let mounted = true;
    const q = query(collection(db, 'tasks'), where('flatId', '==', userProfile.flatId), orderBy('dueDate', 'desc'), limit(100));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!mounted) return;
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(data);
        setLoading(false);
      },
      (error) => {
        if (!mounted) return;
        logError(error, 'Tasks.load');
        toast.error(t('tasks.toast.loadTasksFailed'));
        setLoading(false);
      }
    );
    
    loadUsers();
    loadRecurringTasks();
    handleSync(false);
    
    return () => {
      mounted = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.flatId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !dueDate || !assignedTo) return;
    setAdding(true);
    try {
await addDoc(collection(db, 'tasks'), {
         text,
         done: false,
         assignedTo,
         dueDate,
         priority,
         createdBy: userProfile?.username || '',
         createdAt: new Date().toISOString(),
         flatId: userProfile?.flatId,
       });
       setText('');
       setDueDate('');
       setAssignedTo('');
       setPriority("medium");
      toast.success(t('tasks.toast.added'));

      // Notify the assigned user
      if (assignedTo !== userProfile?.username) {
        const assignedUser = users.find((u) => u.username === assignedTo);
        if (assignedUser) {
          try {
            await createNotification({
              userId: assignedUser.id,
              title: 'New Task Assigned',
              message: `"${text}" — due ${new Date(dueDate).toLocaleDateString()}`,
              type: 'task',
              read: false,
              link: '/dashboard/tasks',
            });
          } catch (notifError) {
            logError(notifError, 'Tasks.createNotification');
          }
        }
      }
    } catch (error) {
      logError(error, 'Tasks.add');
      toast.error(t('tasks.toast.addFailed'));
    } finally {
      setAdding(false);
    }
  };

  const toggleDone = async (task: Task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), { done: !task.done });
      toast.success(task.done ? t('tasks.toast.reopened') : t('tasks.toast.completed'));
    } catch (error) {
      logError(error, 'Tasks.toggleDone');
      toast.error(t('tasks.toast.addFailed'));
    }
  };

  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message: string }>({ open: false, onConfirm: () => {}, message: '' });

  const isAdmin = userProfile?.role === 'admin';

  const handleDelete = async (id: string) => {
    setConfirmState({
      open: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'tasks', id));
          toast.success(t('tasks.toast.deleted'));
        } catch (error) {
          logError(error, 'Tasks.delete');
          toast.error(t('tasks.toast.deleteFailed'));
        }
      },
      message: t('tasks.deleteConfirm')
    });
  };

  const loadRecurringTasks = async () => {
    if (!userProfile?.flatId) return;
    try {
      const snap = await getDocs(query(collection(db, 'recurringTasks'), where('flatId', '==', userProfile.flatId), orderBy('createdAt', 'desc'), limit(200)));
      setRecurringTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecurringTask)));
    } catch (error) {
      logError(error, 'Tasks.loadRecurring');
    }
  };

  const handleSync = async (showToast = true) => {
    if (!userProfile?.flatId) return;
    setSyncing(true);
    try {
      if (showToast) toast.loading(t('tasks.recurringToastSyncStarted'));
      await syncRecurringItems(userProfile.flatId);
      if (showToast) {
        toast.dismiss();
        toast.success(t('tasks.recurringToastSyncComplete'));
      }
      loadRecurringTasks();
    } catch (error) {
      logError(error, 'Tasks.sync');
      if (showToast) {
        toast.dismiss();
        toast.error(t('tasks.recurringToastSyncFailed'));
      }
    } finally {
      setSyncing(false);
    }
  };

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

  return (
    <div className="min-h-screen text-[#1C1400] dark:text-[#FFF5DC]">
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
          <>
            {/* Add Task Form */}
            <div className="bg-white dark:bg-[#2A1E00] border border-[#F0D89A] dark:border-[#3D2E00] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-[#0a0a0a] dark:text-gray-100">{t('tasks.newTask')}</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('tasks.task')}</label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={200}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    required
                  />
                  <div className="text-right text-xs text-gray-400 mt-1">{text.length}/200</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('tasks.dueDate')}</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('tasks.assignTo')}</label>
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                      required
                    >
                      <option value="">{t('tasks.select')}</option>
                      {users.map((u) => (
                        <option key={u.username} value={u.username}>
                          {u.name || u.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('tasks.priority')}</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    >
                      <option value="low" className="bg-white dark:bg-gray-700">{t('tasks.priorityLow')}</option>
                      <option value="medium" className="bg-white dark:bg-gray-700">{t('tasks.priorityMedium')}</option>
                      <option value="high" className="bg-white dark:bg-gray-700">{t('tasks.priorityHigh')}</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-[#0a0a0a] dark:bg-gray-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {adding && <Spinner />}
                  {t('tasks.addTaskButton')}
                </button>
              </form>
            </div>

            {/* Task List */}
            <div className="bg-white dark:bg-gray-800 border border-[#e5e7eb] dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-gray-100">{t('tasks.title')}</h3>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[#6b7280] dark:text-gray-300 text-xs font-medium">
                  {tasks.length}
                </span>
              </div>

              {loading ? (
                <SkeletonList rows={4} />
              ) : tasks.length === 0 ? (
                <EmptyState
                  emoji="✅"
                  title={t('tasks.allClear')}
                  description={t('tasks.noTasks')}
                  action={{
                    label: t('tasks.addTaskButton'),
                    onClick: () => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' }),
                  }}
                />
              ) : (
                <div className="space-y-0">
                  {tasks.map((task, i) => {
                    const isLast = i === tasks.length - 1;
                    const badgeType = getBadgeLabel(task.dueDate);
                    let badgeClass = '';
                    if (task.done) {
                      badgeClass = 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-900 dark:text-gray-500 dark:border-gray-700';
                    } else if (badgeType === 'Upcoming') {
                      badgeClass = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
                    } else if (badgeType === 'Today') {
                      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
                    } else if (badgeType === 'Overdue') {
                      badgeClass = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
                    }

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.04 }}
                        className={`flex items-center gap-3 py-3 ${
                          !isLast ? 'border-b border-[#f3f4f6] dark:border-gray-700' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleDone(task)}
                          className={`w-5 h-5 flex items-center justify-center rounded-full border-2 transition-all duration-150 flex-shrink-0 ${
                            task.done
                              ? 'bg-[#F97316] border-[#F97316]'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#F97316]'
                          }`}
                          aria-label="Toggle done"
                        >
                          <AnimatePresence mode="wait">
                            {task.done && (
                              <motion.svg
                                key={`check-${task.id}`}
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }}
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </motion.svg>
                            )}
                          </AnimatePresence>
                        </button>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm ${
                              task.done
                                ? 'line-through text-gray-400 dark:text-gray-500'
                                : 'text-[#0a0a0a] dark:text-gray-100'
                            }`}
                          >
                            {task.text}
                          </div>
                          <div className="text-xs text-[#6b7280] dark:text-gray-400 mt-0.5 flex items-center gap-2">
                            {users.find((u) => u.username === task.assignedTo)?.name || task.assignedTo}
                            {task.priority && (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                task.priority === 'high'
                                  ? 'bg-red-500/20 text-red-400'
                                  : task.priority === 'medium'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-green-500/20 text-green-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                                }`} />
                                {task.priority}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${badgeClass}`}>
                          {badgeType}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete task"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
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
                  onClick={() => handleSync(true)}
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
                            {rt.pattern === 'daily' ? t('tasks.recurringPatternDaily') : rt.pattern === 'weekly' ? t('tasks.recurringPatternWeekly') : rt.pattern === 'monthly' ? t('tasks.recurringPatternMonthly') : t('tasks.recurringPatternYearly')}
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
      </div>
      <ConfirmModal
        isOpen={confirmState.open}
        title="Confirm"
        message={confirmState.message}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState(prev => ({ ...prev, open: false }));
        }}
        onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}
