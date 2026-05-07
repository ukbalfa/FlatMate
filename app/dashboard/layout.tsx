'use client';
import { useState, useEffect, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Sparkles,
  CheckSquare,
  Users,
  Menu,
  LogOut,
  Sun,
  Moon,
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

const navLinks = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
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

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-border dark:border-dark-border font-[family-name:var(--font-sora)] font-extrabold text-lg text-heading">
        <span className="text-[#1C1400] dark:text-[#FFF5DC]">🏠 FlatMate</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
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
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[rgba(249,115,22,0.15)] to-[rgba(251,191,36,0.1)] text-[#F97316] font-bold border-l-[3px] border-[#F97316] font-[family-name:var(--font-sora)]'
                    : 'text-[#9A7C4A] dark:text-[#9A7C4A] hover:bg-[#FFF0CC] dark:hover:bg-[#2A1E00] hover:text-[#1C1400] dark:hover:text-[#FFF5DC] font-[family-name:var(--font-dm-sans)] font-medium'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <link.icon className={`w-5 h-5 ${isActive ? 'text-[#F97316]' : ''}`} />
                {link.label.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim()}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="p-4 border-t border-[#F0D89A] dark:border-[#3D2E00]">
          <div className="flex items-center gap-3 mb-3 px-2 bg-[#FFF0CC] dark:bg-[#2A1E00] rounded-2xl p-3 border border-[#F0D89A] dark:border-[#3D2E00]">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 gradient-citrus font-[family-name:var(--font-sora)]"
            >
              {user.name?.[0] || user.username?.[0] || '?'}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate font-[family-name:var(--font-sora)] text-heading">{user.name || user.username}</div>
              <div className="text-xs capitalize font-[family-name:var(--font-dm-sans)] text-muted">{user.role}</div>
            </div>
          </div>
          <button
            onClick={() => handleLogout()}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-[rgba(239,68,68,0.1)] hover:text-[#EF4444] font-[family-name:var(--font-dm-sans)] text-muted"
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
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF0]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full relative">
          <div className="absolute inset-0 rounded-full gradient-citrus animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-[#FFFBF0]" />
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
  const { user, userProfile, loading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const { t } = useI18n();
  const [authTimeout, setAuthTimeout] = useState(false);
  const pageTitle = pageNames[pathname] ? t(pageNames[pathname]) : t("nav.dashboard");
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const timer = setTimeout(() => setAuthTimeout(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ((!loading || authTimeout) && !user) {
      router.replace("/login");
    }
  }, [loading, user, router, authTimeout]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const dashboardUser = mapToDashboardUser(userProfile);

  if (loading && !authTimeout) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen bg-[#FFFBF0] dark:bg-[#1C1000]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 bg-[#FFF8E8] dark:bg-[#231900] border-r border-[#F0D89A]">
        <SidebarContent user={dashboardUser} setSidebarOpen={setSidebarOpen} handleLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }}
            className="fixed top-0 left-0 z-50 h-full w-[240px] bg-[#FFF8E8] dark:bg-[#231900] shadow-2xl lg:hidden"
          >
            <SidebarContent user={dashboardUser} setSidebarOpen={setSidebarOpen} handleLogout={handleLogout} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center h-16 px-5 bg-[rgba(255,251,240,0.85)] dark:bg-[rgba(28,16,0,0.85)] backdrop-blur-md border-b border-[#F0D89A] sticky top-0 z-30">
          {/* Left: hamburger (mobile only) */}
          <button
            className="lg:hidden p-2 rounded-lg transition-colors mr-3 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[#FFF0CC] text-muted"
            onClick={() => setSidebarOpen(true)}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title */}
          <h1 className="text-base tracking-tight font-[family-name:var(--font-sora)] font-bold text-lg text-heading">
            <span className="text-[#1C1400] dark:text-[#FFF5DC]">{pageTitle.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim()}</span>
          </h1>

          <div className="flex-1" />

          {/* Right: theme toggle + bell + user */}
          <button
            onClick={() => {
              setTheme(isDark ? 'light' : 'dark');
            }}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 mr-3 hover:scale-105 active:scale-95 bg-bg-section/60 dark:bg-dark-bg-section/80 border border-border dark:border-dark-border"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
          >
            <motion.div
              initial={false}
              animate={{ rotate: isDark ? 0 : 180, scale: isDark ? 1 : 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {isDark ? (
                <Moon className="w-5 h-5 text-accent-honey" />
              ) : (
                <Sun className="w-5 h-5 text-accent" />
              )}
            </motion.div>
          </button>

          <NotificationsDropdown />

          <LanguageSwitcher />

          {dashboardUser && (
            <span className="text-sm font-semibold hidden sm:block text-heading font-[family-name:var(--font-dm-sans)]">
              {dashboardUser.name || dashboardUser.username}
            </span>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 sm:p-8 page-enter bg-[#FFFBF0] dark:bg-[#1C1000]">
          <div className="max-w-5xl mx-auto w-full">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}