'use client';
import { Toaster } from 'sonner';
import { AuthProvider } from '../context/AuthContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import { I18nProvider } from '../context/I18nContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <I18nProvider>
          {children}
          <Toaster richColors position="top-right" />
        </I18nProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}
