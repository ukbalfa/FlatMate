'use client';
import { useState, useEffect, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  Receipt,
  Sparkles,
  CheckSquare,
  Users,
  Menu,
  LogOut,
  Settings,
  Wallet,
  Megaphone,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import NotificationsDropdown from '../components/NotificationsDropdown';
import { useI18n } from '../../context/I18nContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { logError } from '../../lib/errorLogger';
import FlatConnectionModal from '../components/FlatConnectionModal';

const navLinks = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/dashboard/flat", label: "nav.flat", icon: Building2 },
  { href: "/dashboard/rates", label: "nav.rates", icon: TrendingUp },
  { href: "/dashboard/expenses", label: "nav.expenses", icon: Receipt },
  { href: "/dashboard/balances", label: "nav.balances", icon: Wallet },
  { href: "/dashboard/cleaning", label: "nav.cleaning", icon: Sparkles },
  { href: "/dashboard/tasks", label: "nav.tasks", icon: CheckSquare },
  { href: "/dashboard/roommates", label: "nav.roommates", icon: Users },
  { href: "/dashboard/settings", label: "nav.settings", icon: Settings },
  { href: "/dashboard/announcements", label: "nav.announcements", icon: Megaphone },
];

const pageNames: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/dashboard/flat": "nav.flat",
  "/dashboard/rates": "nav.rates",
  "/dashboard/expenses": "nav.expenses",
  "/dashboard/balances": "nav.balances",
  "/dashboard/cleaning": "nav.cleaning",
  "/dashboard/tasks": "nav.tasks",
  "/dashboard/roommates": "nav.roommates",
  "/dashboard/settings": "nav.settings",
  "/dashboard/announcements": "nav.announcements",
};

interface DashboardUser {
  id?: string;
  username: string;
  name?: string;
  role?: string;
  color?: string;
}

function mapToDashboardUser(userProfile: { uid: string; username: string; name?: string; role?: string; color?: string } | null): DashboardUser | null {
  if (!userProfile) return null;
  return {
    id: userProfile.uid,
    username: userProfile.username,
    name: userProfile.name,
    role: userProfile.role,
    color: userProfile.color,
  };
}

function SidebarContent({ user, setSidebarOpen, handleLogout }: { user: DashboardUser | null, setSidebarOpen: (v: boolean) => void, handleLogout: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="flex flex-col h-full bg-[#050505] border-r border-white/5">
      {/* Logo */}
      <Link href="/" className="flex items-center justify-center h-20 border-b border-white/5 font-space-grotesk font-extrabold text-2xl text-white hover:text-white/80 transition-colors group">
        <span className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-citrus flex items-center justify-center text-white text-lg font-bold group-hover:scale-110 transition-transform shadow-[0_0_15px_-3px_#F97316]">
            F
          </div>
          flatmate
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-widest font-dm-mono text-white/30">
          Main Menu
        </div>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <motion.div
              key={link.href}
              whileHover={{ x: isActive ? 0 : 4 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-white/10 text-white font-bold border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] font-dm-sans'
                    : 'text-white/50 hover:bg-white/5 hover:text-white font-dm-sans font-medium border border-transparent'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <link.icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'opacity-70'}`} />
                {t(link.label)}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="p-4 border-t border-white/5 bg-bg-section">
          <div className="flex items-center gap-3 mb-3 px-3 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0 bg-[#ccff00] shadow-[0_0_20px_-5px_#ccff00] font-space-grotesk"
            >
              {user.name?.[0] || user.username?.[0] || '?'}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold truncate font-space-grotesk text-white">{user.name || user.username}</div>
              <div className="text-[10px] uppercase tracking-widest font-dm-mono text-white/40">{user.role}</div>
            </div>
          </div>
          <button
            onClick={() => handleLogout()}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 text-sm font-bold rounded-xl transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 font-dm-sans text-white/50 border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

const LoadingScreen = memo(function LoadingScreen() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full relative">
          <div className="absolute inset-0 rounded-full gradient-citrus animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-[#050505]" />
          <div className="absolute inset-0 rounded-full gradient-citrus animate-ping opacity-75" />
        </div>
        <span className="text-sm font-[family-name:var(--font-dm-mono)] font-medium text-muted">{t('common.loading')}</span>
      </div>
    </div>
  );
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, userProfile, loading, showFlatModal, setShowFlatModal } = useAuth();
  const pathname = usePathname();
  const { t } = useI18n();
  const [authTimeout, setAuthTimeout] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pageTitle = pageNames[pathname] ? t(pageNames[pathname]) : t("nav.dashboard");

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setAuthTimeout(true), 10000);
    return () => clearTimeout(timer);
     
  }, []);

  useEffect(() => {
    if ((!loading || authTimeout) && !user) {
      router.replace("/login");
    }
  }, [loading, user, router, authTimeout]);

  useEffect(() => {
    if (!loading && user && !userProfile?.flatId) {
      setShowFlatModal(true);
    }
  }, [loading, user, userProfile?.flatId, setShowFlatModal]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      logError(error, 'Layout.logout');
    }
  };

  const dashboardUser = mapToDashboardUser(userProfile);

  if (!mounted || (loading && !authTimeout)) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 bg-[#050505]">
        <SidebarContent user={dashboardUser} setSidebarOpen={setSidebarOpen} handleLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
            className="fixed top-0 left-0 z-50 h-full w-[260px] shadow-[20px_0_40px_rgba(0,0,0,0.5)] lg:hidden bg-[#050505] border-r border-white/5"
          >
            <SidebarContent user={dashboardUser} setSidebarOpen={setSidebarOpen} handleLogout={handleLogout} />
          </motion.aside>
        )}
      </AnimatePresence>

      {showFlatModal && <FlatConnectionModal />}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg-section rounded-tl-3xl border-t border-l border-white/5 lg:mt-2 lg:mb-2 lg:mr-2 shadow-2xl relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-[#84CC16]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/assets/noise.svg')] opacity-2 pointer-events-none mix-blend-overlay" />

        {/* Topbar */}
        <header className="flex items-center h-20 px-6 sm:px-8 border-b border-white/5 sticky top-0 z-30 bg-bg-section/80 backdrop-blur-xl">
          {/* Left: hamburger (mobile only) */}
          <button
            className="lg:hidden p-2 rounded-xl transition-colors mr-4 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/10 text-white/70 border border-white/10"
            onClick={() => setSidebarOpen(true)}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <h1 className="text-xl sm:text-2xl tracking-tight font-space-grotesk font-bold text-white flex items-center gap-3">
            <span className="inline-block w-2 h-6 bg-accent rounded-full" />
            {pageTitle}
          </h1>

          <div className="flex-1" />

          {/* Right: theme toggle + bell + user */}
          {/* Removing Theme Toggle since we are forcing dark mode */}

          <div className="bg-white/5 border border-white/10 rounded-full flex items-center p-1.5 px-3 gap-2">
             <NotificationsDropdown />
             <div className="w-[1px] h-4 bg-white/20" />
             <LanguageSwitcher />
          </div>

          {dashboardUser && (
            <Link href="/dashboard/settings" className="hidden sm:flex items-center gap-3 ml-6 pl-6 border-l border-white/10 hover:opacity-80 transition-opacity">
              <div className="text-right">
                 <div className="text-sm font-bold text-white font-space-grotesk">{dashboardUser.name || dashboardUser.username}</div>
                 <div className="text-[10px] text-white/40 uppercase tracking-widest font-dm-mono">{dashboardUser.role}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#ccff00] border border-[#ccff00]/50 text-black flex items-center justify-center font-bold shadow-[0_0_15px_-3px_#ccff00]" aria-label={`${dashboardUser.name || dashboardUser.username}'s profile`}>
                 {dashboardUser.name?.[0] || dashboardUser.username?.[0] || '?'}
              </div>
            </Link>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto page-enter relative z-10 custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}