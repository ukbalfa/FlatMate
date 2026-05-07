/* eslint-disable react/display-name */
import { renderHook, act } from '@testing-library/react';
import { I18nProvider, useI18n } from '../context/I18nContext';

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <I18nProvider>{children}</I18nProvider>
  );
}

describe('I18nContext', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => mockStorage[key] || null);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      mockStorage[key] = value;
    });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
      delete mockStorage[key];
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('useI18n', () => {
    it('returns default language as English', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.language).toBe('en');
    });

    it('translates a key to English value', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.t('nav.dashboard')).toBe('Dashboard');
    });

    it('returns the key itself for missing translations', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('replaces parameters in translation strings', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(
        result.current.t('dashboard.expenseAdded', { category: 'Rent' })
      ).toBe('Rent expense added');
    });

    it('replaces multiple parameters', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(
        result.current.t('dashboard.paidAmount', { paidBy: 'Alice', amount: '500' })
      ).toBe('Alice paid 500 UZS');
    });

    it('handles numeric parameters', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(
        result.current.t('dashboard.daysRemaining', { days: 5 })
      ).toBe('5 days');
    });

    it('switches language to Russian', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      act(() => {
        result.current.setLanguage('ru');
      });
      expect(result.current.language).toBe('ru');
      expect(result.current.t('nav.dashboard')).toBe('\u0413\u043b\u0430\u0432\u043d\u0430\u044f');
    });

    it('switches language to Uzbek', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      act(() => {
        result.current.setLanguage('uz');
      });
      expect(result.current.language).toBe('uz');
      expect(result.current.t('nav.dashboard')).toBe('Bosh sahifa');
    });

    it('translates parameterized strings in Russian', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      act(() => {
        result.current.setLanguage('ru');
      });
      expect(
        result.current.t('dashboard.expenseAdded', { category: '\u0410\u0440\u0435\u043d\u0434\u0430' })
      ).toBe('\u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d \u0440\u0430\u0441\u0445\u043e\u0434 \u0410\u0440\u0435\u043d\u0434\u0430');
    });

    it('preserves localStorage persistence on language switch', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      act(() => {
        result.current.setLanguage('ru');
      });
      expect(mockStorage['flatmate-language']).toBe('ru');
    });

    it('reads initial language from localStorage', () => {
      mockStorage['flatmate-language'] = 'uz';
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.language).toBe('uz');
    });

    it('falls back to English for invalid localStorage value', () => {
      mockStorage['flatmate-language'] = 'fr';
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.language).toBe('en');
    });

    it('has auth.password translated in all three languages', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.t('auth.password')).toBe('Password');

      act(() => result.current.setLanguage('ru'));
      expect(result.current.t('auth.password')).toBe('\u041f\u0430\u0440\u043e\u043b\u044c');

      act(() => result.current.setLanguage('uz'));
      expect(result.current.t('auth.password')).toBe('Parol');
    });

    it('has tasks.status translations in all three languages', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.t('tasks.status.today')).toBe('Today');

      act(() => result.current.setLanguage('ru'));
      expect(result.current.t('tasks.status.today')).toBe('\u0421\u0435\u0433\u043e\u0434\u043d\u044f');

      act(() => result.current.setLanguage('uz'));
      expect(result.current.t('tasks.status.today')).toBe('Bugun');
    });

    it('t function is stable across re-renders with same language', () => {
      const wrapper = createWrapper();
      const { result, rerender } = renderHook(() => useI18n(), { wrapper });
      const firstT = result.current.t;
      rerender();
      expect(result.current.t).toBe(firstT);
    });

    it('t function returns correct translation after language switch', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      expect(result.current.t('nav.dashboard')).toBe('Dashboard');
      act(() => result.current.setLanguage('ru'));
      expect(result.current.t('nav.dashboard')).toBe('\u0413\u043b\u0430\u0432\u043d\u0430\u044f');
    });

    it('setLanguage updates localStorage', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useI18n(), { wrapper });
      act(() => result.current.setLanguage('uz'));
      expect(mockStorage['flatmate-language']).toBe('uz');
    });
  });
});
