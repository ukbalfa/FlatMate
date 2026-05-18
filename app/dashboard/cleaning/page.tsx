'use client';
import { useI18n } from '../../../context/I18nContext';
import { useNotifications } from '../../../context/NotificationsContext';
import { useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { toast } from 'sonner';
import ConfirmModal from '../../components/ConfirmModal';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { logError } from '../../../lib/errorLogger';
import { useCleaningTasks } from '../../../lib/hooks/useCleaningTasks';
import { useRoommates } from '../../../lib/hooks/useRoommates';
import type { CleaningTask } from '../../../lib/types';



import { getMonday } from '../../../lib/utils';



const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CleaningPage() {
  const { t } = useI18n();
  const { createNotification } = useNotifications();
  const { userProfile } = useAuth();
  const [task, setTask] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [assignedTo, setAssignedTo] = useState('');
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: (() => void) | null, message: string}>({isOpen: false, action: null, message: ''});
  const weekStart = getMonday(new Date());
  const { cleaningTasks: cleaning, loading } = useCleaningTasks(userProfile?.flatId, weekStart);
  const { roommates: users } = useRoommates(userProfile?.flatId);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !dayOfWeek || !assignedTo) return;
    try {
      await addDoc(collection(db, 'cleaning'), { task, assignedTo, dayOfWeek, weekStart, done: false, flatId: userProfile?.flatId });
      setTask('');
      setDayOfWeek('Monday');
      setAssignedTo('');
      toast.success(t('cleaning.toast.taskAdded'));
      const assignedSnap = await getDocs(query(collection(db, 'users'), where('username', '==', assignedTo)));
      if (!assignedSnap.empty) {
        const assignedDoc = assignedSnap.docs[0];
        if (assignedDoc && assignedDoc.id !== userProfile?.uid) {
          await createNotification({
            userId: assignedDoc.id,
            title: t('cleaning.toast.taskAssigned'),
            message: `"${task}" — ${dayOfWeek}`,
            type: 'cleaning',
            read: false,
            link: '/dashboard/cleaning',
          });
        }
      }
  
    } catch (error) {
      logError(error, 'Cleaning.add');
      toast.error(error instanceof Error ? error.message : t('cleaning.toast.addFailed'));
    }
  };

  const toggleDone = async (item: CleaningTask) => {
    try {
      await updateDoc(doc(db, 'cleaning', item.id), { done: !item.done });
      toast.success(t('cleaning.toast.taskDone'));
    } catch (error) {
      logError(error, 'Cleaning.toggleDone');
      toast.error(t('cleaning.toast.updateFailed'));
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  const handleDelete = async (id: string) => {
    setConfirmModal({ isOpen: true, action: async () => {
      try {
        await deleteDoc(doc(db, 'cleaning', id));
        toast.success(t('cleaning.toast.deleted'));
      } catch (error) {
        logError(error, 'Cleaning.delete');
        toast.error(t('cleaning.toast.deleteFailed'));
      }
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }, message: t('cleaning.deleteConfirm') });
  };

  return (
    <div className="min-h-screen">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={t('common.confirm')}
        message={confirmModal.message}
        confirmLabel={t('common.delete')}
        onConfirm={() => confirmModal.action?.()}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Cleaning Schedule Card */}
        <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">{t('cleaning.title')}</h2>
            <span className="text-sm text-[#9A7C4A] dark:text-gray-400">
              {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
              {new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-4 border-b border-white/5 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-5 h-5 bg-white/10 rounded-full"></div>
                      <div className="h-4 bg-white/10 rounded w-1/3"></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/10 rounded-full"></div>
                        <div className="h-4 bg-white/10 rounded w-20"></div>
                      </div>
                      <div className="h-6 bg-white/10 rounded w-16"></div>
                      <div className="w-5 h-5 bg-white/10 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : cleaning.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm flex flex-col items-center gap-3">
              <svg className="w-8 h-8 text-gray-500 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 12c0-4.14-3.36-7.5-7.5-7.5S4.5 7.86 4.5 12s3.36 7.5 7.5 7.5S19.5 16.14 19.5 12z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4" />
              </svg>
              <span>{t('cleaning.noTasks')}</span>
            </div>
          ) : (
            <div className="space-y-0">
              {cleaning.map((item, i) => {
                const assignedUser = users.find((u) => u.username === item.assignedTo);
                const isLast = i === cleaning.length - 1;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between py-4 ${item.done ? 'opacity-60' : ''} ${
                      !isLast ? 'border-b border-white/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.done ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 flex-shrink-0"></div>
                      )}
                      <span
                        className={`font-medium ${
                          item.done
                            ? 'line-through text-[#6b7280] dark:text-gray-500'
                            : 'text-white'
                        }`}
                      >
                        {item.task}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                          style={{ background: assignedUser?.color || '#F97316' }}
                        >
                          {assignedUser?.name?.[0]?.toUpperCase() || assignedUser?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                        <span className="text-sm text-gray-400">
                          {assignedUser?.name || item.assignedTo}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-white/8 text-white text-xs font-medium">
                        {t('cleaning.day.' + item.dayOfWeek)}
                      </span>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleDone(item)}
                          className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-accent focus:ring-2 focus:ring-accent focus:ring-offset-0 cursor-pointer transition"
                        />
                      </label>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg"
                          aria-label="Delete cleaning task"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin Add Task Form */}
        {userProfile?.role === 'admin' && (
          <div className="bg-[#1a1d27] border border-white/6 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">{t('cleaning.addTaskTitle')}</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('cleaning.taskName')}</label>
                <input
                  type="text"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('cleaning.day')}</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                    required
                  >
                    {DAYS.map((day) => (
                      <option className="bg-[#1a1d27]" key={day} value={day}>
                        {t('cleaning.day.' + day)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('tasks.assignTo')}</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
                    required
                  >
                    <option className="bg-[#1a1d27]" value="">{t('cleaning.select')}</option>
                    {users.map((u) => (
                      <option className="bg-[#1a1d27]" key={u.username} value={u.username}>
                        {u.name || u.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-accent text-white rounded-lg px-4 py-3 font-medium hover:bg-accent-hover transition"
              >
                {t('cleaning.addTaskButton')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
