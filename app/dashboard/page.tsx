'use client';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import Link from 'next/link';
import { SkeletonCard } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import RentCountdown from '../components/RentCountdown';
import {
  Receipt,
  CheckSquare,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  ArrowRight,
  Wallet,
  Activity,
  Bell,
} from 'lucide-react';

import { getMonday, formatTimeAgo } from '../../lib/utils';
import type { Expense, Task, CleaningTask, Roommate, ActivityItem } from '../../lib/types';



export default function DashboardPage() {
  const { userProfile, setShowFlatModal } = useAuth();
  const { t } = useI18n();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [users, setUsers] = useState<Roommate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

useEffect(() => {
    if (!userProfile?.flatId) {
      setLoading(false);
      return;
    }

    const weekStart = getMonday(new Date());
    const unsubs: (() => void)[] = [];
    let loadedCount = 0;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= 4) {
        setLoading(false);
      }
    };

    setLoading(true);

    // Expenses
    const expUnsub = onSnapshot(
      query(collection(db, 'expenses'), where('flatId', '==', userProfile.flatId), orderBy('date', 'desc'), limit(50)),
      (snap) => {
        setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense)));
        checkAllLoaded();
      }
    );
    unsubs.push(expUnsub);

    // Tasks
    const taskUnsub = onSnapshot(
      query(collection(db, 'tasks'), where('flatId', '==', userProfile.flatId), orderBy('dueDate'), limit(100)),
      (snap) => {
        setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)));
        checkAllLoaded();
      }
    );
    unsubs.push(taskUnsub);

    // Cleaning (current week)
    const cleanUnsub = onSnapshot(
      query(collection(db, 'cleaning'), where('flatId', '==', userProfile.flatId), where('weekStart', '==', weekStart)),
      (snap) => {
        setCleaningTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CleaningTask)));
        checkAllLoaded();
      }
    );
    unsubs.push(cleanUnsub);

    // Users
    const usersUnsub = onSnapshot(
      query(collection(db, 'users'), where('flatId', '==', userProfile.flatId), orderBy('createdAt', 'desc')),
      (snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Roommate)));
        checkAllLoaded();
      }
    );
    unsubs.push(usersUnsub);

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [userProfile?.flatId]);

  // Activity feed (derived from expenses + tasks, re-computes when they change)
  const activityFeed = useMemo(() => {
    const items: ActivityItem[] = [];
    expenses.slice(0, 10).forEach((expense) => {
      items.push({
        id: `expense-${expense.id}`,
        type: 'expense',
        title: t('dashboard.expenseAdded', { category: expense.category }),
        description: t('dashboard.paidAmount', { paidBy: expense.paidBy, amount: expense.amount.toLocaleString() }),
        timestamp: expense.date,
        amount: expense.amount,
        user: expense.paidBy,
      });
    });
    const todayDate = new Date().toISOString().slice(0, 10);
    tasks
      .filter((task) => !task.done && task.dueDate >= todayDate)
      .slice(0, 5)
      .forEach((task) => {
        const daysUntil = Math.ceil(
          (new Date(task.dueDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );
        items.push({
          id: `task-${task.id}`,
          type: 'task',
          title: t('dashboard.taskDueSoon'),
           description: `"${task.text}" ${t('dashboard.assignedTo')} ${task.assignedTo} (${
             daysUntil === 0 ? t('common.today') : t('dashboard.daysRemaining', { days: daysUntil })
           })`,
          timestamp: task.dueDate,
          user: task.assignedTo,
        });
      });
    items.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return items.slice(0, 15);
  }, [expenses, tasks, t]);

  // Calculate stats
  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
  const totalMonthExpenses = monthExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  const myMonthExpenses = monthExpenses
    .filter((e) => e.paidBy === userProfile?.username)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const myTasks = tasks.filter(
    (t) => t.assignedTo === userProfile?.username && !t.done
  );
  const overdueTasks = myTasks.filter(
    (t) => new Date(t.dueDate) < new Date(new Date().toISOString().slice(0, 10))
  );

  const myCleaning = cleaningTasks.filter(
    (c) => c.assignedTo === userProfile?.username && !c.done
  );
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysCleaning = myCleaning.filter((c) => c.dayOfWeek === today);

  const stats = [
    {
      title: t('dashboard.thisMonthExpenses'),
      value: totalMonthExpenses.toLocaleString() + ' UZS',
      subtitle: t('dashboard.totalExpenses'),
      icon: Wallet,
      color: 'bg-[#F97316]',
      trend: myMonthExpenses > 0 ? t('dashboard.youPaid') + ' ' + myMonthExpenses.toLocaleString() : null,
    },
    {
      title: t('dashboard.myTasks'),
      value: myTasks.length.toString(),
      subtitle: `${overdueTasks.length} ${t('dashboard.overdue')}`,
      icon: CheckSquare,
      color: overdueTasks.length > 0 ? 'bg-red-500' : 'bg-blue-500',
      alert: overdueTasks.length > 0,
    },
    {
      title: t('dashboard.cleaning'),
      value: myCleaning.length.toString(),
      subtitle: todaysCleaning.length > 0 ? `${todaysCleaning.length} ${t('dashboard.today')}` : t('dashboard.thisWeek'),
      icon: Sparkles,
      color: todaysCleaning.length > 0 ? 'bg-amber-500' : 'bg-purple-500',
      alert: todaysCleaning.length > 0,
    },
    {
      title: t('dashboard.roommates'),
      value: users.length.toString(),
      subtitle: t('dashboard.activeMembers'),
      icon: Users,
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-10 text-center sm:text-left">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-space-grotesk font-bold text-white tracking-tight"
          >
            {t('dashboard.welcome')}, <span className="text-transparent bg-clip-text bg-gradient-citrus">{userProfile?.name || userProfile?.username}</span>!
          </motion.h1>
          <p className="text-white/50 mt-3 font-dm-sans text-lg">
            {t('dashboard.monthlyOverview')}
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <div className="space-y-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          </div>
        ) : (
          <>
        {!userProfile?.flatId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-md bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-center justify-between"
          >
            <div>
              <p className="text-amber-400 font-medium">You&apos;re not in a flat yet</p>
              <p className="text-gray-400 text-sm">Set up your flat to start tracking expenses and chores with your roommates.</p>
            </div>
            <button
              onClick={() => setShowFlatModal(true)}
              className="bg-amber-400 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-amber-300 transition text-sm whitespace-nowrap"
            >
              Set up your flat
            </button>
          </motion.div>
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:border-white/30 transition-all cursor-pointer backdrop-blur-xl relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color.replace('bg-', 'bg-').replace('-500', '-500/20')} rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500`} />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-white/50 text-sm font-dm-mono uppercase tracking-widest">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-2 font-space-grotesk">{stat.value}</p>
                  <p
                    className={`text-sm mt-2 font-dm-sans ${
                      stat.alert ? 'text-red-400' : 'text-white/40'
                    }`}
                  >
                    {stat.subtitle}
                  </p>
                  {stat.trend && (
                    <p className="text-xs text-[#ccff00] mt-1 font-dm-mono">{stat.trend}</p>
                  )}
                </div>
                <div className={`${stat.color.replace('bg-', 'bg-').replace('-500', '-500')} p-3 rounded-2xl shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <h2 className="text-xl font-bold text-white mb-6 font-space-grotesk">{t('dashboard.quickActions')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: t('dashboard.addExpense'),
                    href: '/dashboard/expenses',
                    icon: Receipt,
                    color: 'bg-[#F97316]',
                  },
                  {
                    label: t('dashboard.addTask'),
                    href: '/dashboard/tasks',
                    icon: CheckSquare,
                    color: 'bg-blue-500',
                  },
                  {
                    label: t('dashboard.viewBalances'),
                    href: '/dashboard/balances',
                    icon: Wallet,
                    color: 'bg-amber-500',
                  },
                  {
                    label: t('dashboard.exchangeRates'),
                    href: '/dashboard/rates',
                    icon: TrendingUp,
                    color: 'bg-purple-500',
                  },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-3 p-5 bg-black/40 rounded-2xl hover:bg-white/10 transition-all duration-300 group/action border border-white/5 hover:border-white/20 hover:scale-[1.02]"
                  >
                    <div className={`${action.color} p-3 rounded-xl group-hover/action:scale-110 group-hover/action:rotate-3 transition-transform duration-300 shadow-lg`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-dm-sans text-white/60 group-hover/action:text-white transition-colors text-center">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3 font-space-grotesk">
                  <Activity className="w-6 h-6 text-[#F97316]" />
                  {t('dashboard.recentActivity')}
                </h2>
                <Link
                  href="/dashboard/expenses"
                  className="text-sm text-[#F97316] hover:text-[#EA6D0E] flex items-center gap-1 font-dm-mono uppercase tracking-widest"
                >
                      {t('dashboard.viewAllExpenses')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-2xl"></div>
                  ))}
                </div>
              ) : activityFeed.length === 0 ? (
                <EmptyState
                  icon={<Bell className="w-8 h-8" />}
                  title={t('dashboard.noActivity')}
                  description={t('dashboard.noActivityDesc')}
                />
              ) : (
                <div className="space-y-4">
                  {activityFeed.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-black/20 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-2xl transition-all duration-300 group"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${
                          activity.type === 'expense'
                            ? 'bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30'
                            : activity.type === 'task'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {activity.type === 'expense' ? (
                          <Receipt className="w-6 h-6" />
                        ) : activity.type === 'task' ? (
                          <CheckSquare className="w-6 h-6" />
                        ) : (
                          <Sparkles className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-bold font-space-grotesk truncate">
                          {activity.title}
                        </p>
                        <p className="text-white/50 text-sm font-dm-sans truncate mt-0.5">
                          {activity.description}
                        </p>
                      </div>
                      <span className="text-xs text-white/30 font-dm-mono flex-shrink-0">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Rent, Tasks & Cleaning */}
          <div className="space-y-6">
            {/* Rent Countdown */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
               <RentCountdown />
            </div>

            {/* My Tasks */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 font-space-grotesk">
                  <Clock className="w-5 h-5 text-blue-400" />
                  {t('dashboard.myTasks')}
                </h2>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold font-dm-mono">
                  {myTasks.length} {t('dashboard.pending')}
                </span>
              </div>

              {myTasks.length === 0 ? (
                <EmptyState
                  icon={<CheckSquare className="w-8 h-8" />}
                  title={t('dashboard.allCaughtUp')}
                  description={t('dashboard.noPendingTasks')}
                />
              ) : (
                <div className="space-y-3 relative z-10">
                  {myTasks.slice(0, 5).map((task) => {
                    const daysUntil = Math.ceil(
                      (new Date(task.dueDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const isOverdue = daysUntil < 0;
                    const isToday = daysUntil === 0;

                    return (
                      <Link
                        key={task.id}
                        href="/dashboard/tasks"
                        className="block p-4 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all"
                      >
                        <p className="text-white text-sm font-bold font-dm-sans line-clamp-2">
                          {task.text}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span
                            className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-dm-mono ${
                              isOverdue
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isToday
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {isOverdue
                              ? `${Math.abs(daysUntil)} ${t('dashboard.overdue')}`
                              : isToday
                              ? t('dashboard.today')
                              : `${daysUntil} ${t('dashboard.days')}`}
                          </span>
                          <span className="text-xs text-white/30 font-dm-mono">
                            {task.dueDate}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  {myTasks.length > 5 && (
                    <Link
                      href="/dashboard/tasks"
                      className="block text-center text-sm font-bold text-blue-400 hover:text-blue-300 py-3 mt-2 font-dm-sans"
                    >
                      {t('dashboard.viewMore')} {myTasks.length - 5} {t('dashboard.more')} {t('dashboard.tasks')} →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* My Cleaning Schedule */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 font-space-grotesk">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  {t('dashboard.cleaning')}
                </h2>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold font-dm-mono">
                  {myCleaning.length} {t('dashboard.tasks')}
                </span>
              </div>

              {myCleaning.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="w-8 h-8" />}
                  title={t('dashboard.noCleaning')}
                  description={t('dashboard.noCleaningDesc')}
                />
              ) : (
                <div className="space-y-3 relative z-10">
                  {myCleaning.map((task) => (
                    <Link
                      key={task.id}
                      href="/dashboard/cleaning"
                      className="block p-4 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                      <p className="text-white text-sm font-bold font-dm-sans">{task.task}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span
                          className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-dm-mono ${
                            task.dayOfWeek === today
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-white/5 text-white/50 border border-white/10'
                          }`}
                        >
                          {task.dayOfWeek === today ? t('dashboard.today') : t('cleaning.day.' + task.dayOfWeek)}
                        </span>
                        <span
                          className={`text-xs font-bold font-dm-sans ${
                            task.done ? 'text-green-400' : 'text-white/30'
                          }`}
                        >
                          {task.done ? t('common.done') : t('dashboard.pending')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Summary */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 font-space-grotesk relative z-10">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                {t('dashboard.monthlyOverview')}
              </h2>
              <div className="space-y-5 relative z-10">
                <div>
                  <div className="flex justify-between text-sm mb-2 font-dm-sans">
                    <span className="text-white/50">{t('dashboard.yourContribution')}</span>
                    <span className="text-white font-bold">
                      {((myMonthExpenses / (totalMonthExpenses || 1)) * 100).toFixed(
                        0
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-citrus rounded-full transition-all duration-1000 relative"
                      style={{
                        width: `${Math.min(
                          (myMonthExpenses / (totalMonthExpenses || 1)) * 100,
                          100
                        )}%`,
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full blur-sm" />
                    </div>
                  </div>
                  <p className="text-[10px] text-white/30 mt-2 font-dm-mono tracking-widest uppercase">
                    {myMonthExpenses.toLocaleString()} of{' '}
                    {totalMonthExpenses.toLocaleString()} UZS
                  </p>
                </div>

                <div className="pt-5 border-t border-white/10">
                  <Link
                    href="/dashboard/expenses"
                    className="flex items-center justify-between text-sm font-bold text-white/50 hover:text-white transition-colors py-2"
                  >
                    <span>{t('dashboard.viewAllExpenses')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/dashboard/balances"
                    className="flex items-center justify-between text-sm font-bold text-white/50 hover:text-white transition-colors py-2"
                  >
                    <span>{t('dashboard.checkBalances')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
            </div>
          </div>
        </>
        )}
        </div>
      </div>
  );
}
