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
    act(() => result.current.removeWidget('stats'));
    act(() => result.current.addWidget('stats'));
    // Should be appended at end, not at canonical position 0
    expect(result.current.visibleWidgets[result.current.visibleWidgets.length - 1]).toBe('stats');
    expect(result.current.hiddenWidgets).toEqual([]);
  });

  it('reorderWidgets moves item from source to target index', () => {
    const { result } = renderHook(() => useDashboardWidgets());
    // Move 'stats' (index 0) to index 2
    act(() => result.current.reorderWidgets(0, 2));
    expect(result.current.visibleWidgets[0]).toBe('quickActions');
    expect(result.current.visibleWidgets[1]).toBe('activity');
    expect(result.current.visibleWidgets[2]).toBe('stats');
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
