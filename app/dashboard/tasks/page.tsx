'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { Trash2 } from 'lucide-react';
import { Spinner } from '../../components/Spinner';
import { SkeletonList } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import { useNotifications } from '../../../context/NotificationsContext';
import { logError } from '../../../lib/errorLogger';
import type { Roommate, Task } from '../../../lib/types';



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
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

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
        createdBy: userProfile?.username || '',
        createdAt: new Date().toISOString(),
        flatId: userProfile?.flatId,
      });
      setText('');
      setDueDate('');
      setAssignedTo('');
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

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Add Task Form */}
        <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">{t('tasks.newTask')}</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('tasks.task')}</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={200}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                required
              />
              <div className="text-right text-xs text-gray-400 mt-1">{text.length}/200</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('tasks.dueDate')}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('tasks.assignTo')}</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
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
            </div>
            <button
              type="submit"
              disabled={adding}
              className="w-full bg-[#F97316] text-white rounded-lg px-4 py-3 font-medium hover:bg-[#EA6D0E] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {adding && <Spinner />}
              {t('tasks.addTaskButton')}
            </button>
          </form>
        </div>

        {/* Task List */}
        <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-white">{t('tasks.title')}</h3>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-400 text-xs font-medium">
              {tasks.length}
            </span>
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
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
                  badgeClass = 'bg-white/5 text-gray-400 border-white/10';
                } else if (badgeType === 'Upcoming') {
                  badgeClass = 'bg-green-500/10 text-green-400 border-green-500/20';
                } else if (badgeType === 'Today') {
                  badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                } else if (badgeType === 'Overdue') {
                  badgeClass = 'bg-red-500/10 text-red-400 border-red-500/20';
                }

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className={`flex items-center gap-3 py-3 ${
                      !isLast ? 'border-b border-white/5' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleDone(task)}
                      className={`w-5 h-5 flex items-center justify-center rounded-full border-2 transition-all duration-150 flex-shrink-0 ${
                        task.done
                          ? 'bg-[#F97316] border-[#F97316]'
                          : 'border-gray-600 bg-transparent hover:border-[#F97316]'
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
                            ? 'line-through text-gray-500'
                            : 'text-white'
                        }`}
                      >
                        {task.text}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {users.find((u) => u.username === task.assignedTo)?.name || task.assignedTo}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${badgeClass}`}>
                      {badgeType}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
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
