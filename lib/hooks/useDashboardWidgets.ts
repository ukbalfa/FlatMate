'use client';
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'dashboard_widgets';

const ALL_WIDGETS = [
  'stats', 'quickActions', 'activity', 'rentCountdown',
  'tasks', 'cleaning', 'monthlySummary',
] as const;

export type WidgetId = (typeof ALL_WIDGETS)[number];

interface WidgetConfig {
  visibleWidgets: WidgetId[];
}

function defaults(): WidgetConfig {
  return { visibleWidgets: [...ALL_WIDGETS] };
}

function read(): WidgetConfig {
  if (typeof window === 'undefined') return defaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as WidgetConfig;
    const filtered = parsed.visibleWidgets.filter((id): id is WidgetId =>
      ALL_WIDGETS.includes(id as WidgetId)
    );
    return { visibleWidgets: filtered };
  } catch {
    return defaults();
  }
}

export function useDashboardWidgets() {
  const [config, setConfig] = useState<WidgetConfig>(read);

  const visibleWidgets = config.visibleWidgets;
  const hiddenWidgets = ALL_WIDGETS.filter((id) => !config.visibleWidgets.includes(id));

  const save = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const removeWidget = useCallback((id: WidgetId) => {
    setConfig((prev) => ({
      visibleWidgets: prev.visibleWidgets.filter((w) => w !== id),
    }));
  }, []);

  const addWidget = useCallback((id: WidgetId) => {
    setConfig((prev) => {
      if (prev.visibleWidgets.includes(id)) return prev;
      const idx = ALL_WIDGETS.indexOf(id);
      const before = prev.visibleWidgets.findIndex((w) => ALL_WIDGETS.indexOf(w) > idx);
      const next = [...prev.visibleWidgets];
      if (before === -1) {
        next.push(id);
      } else {
        next.splice(before, 0, id);
      }
      return { visibleWidgets: next };
    });
  }, []);

  const reorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    setConfig((prev) => {
      const next = [...prev.visibleWidgets];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      return { visibleWidgets: next };
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(defaults());
  }, []);

  return { visibleWidgets, hiddenWidgets, removeWidget, addWidget, reorderWidgets, save, resetToDefaults };
}
