# Editable Dashboard Widgets — Design Spec

## Overview

Make the dashboard page (`app/dashboard/page.tsx`) customizable per-user by turning each hardcoded section into a draggable, removable, addable widget. Widget configuration is stored in `localStorage` (key: `dashboard_widgets`) — no server writes.

## Data Model

```ts
// localStorage key
'dashboard_widgets'

// Shape:
{
  visibleWidgets: WidgetId[]   // ordered array of visible widget IDs
}

// WidgetId = 'stats' | 'quickActions' | 'activity' | 'rentCountdown' | 'tasks' | 'cleaning' | 'monthlySummary'
```

Hidden widgets are inferred — any widget ID not in `visibleWidgets` is hidden and available to add back.

**Default order** (if no localStorage entry exists):
`['stats', 'quickActions', 'activity', 'rentCountdown', 'tasks', 'cleaning', 'monthlySummary']`

## Widget Registry

A single registry object maps each `WidgetId` to its metadata and component:

```ts
const WIDGET_REGISTRY: Record<WidgetId, { title, icon, component, defaultVisible }>
```

Components are extracted from the current dashboard page, each into its own file under `app/dashboard/components/widgets/`:
- `StatsWidget.tsx` (4 stat cards)
- `QuickActionsWidget.tsx` (4 action links)
- `ActivityWidget.tsx` (activity feed)
- `RentCountdownWidget.tsx` (rent countdown)
- `TasksWidget.tsx` (my tasks)
- `CleaningWidget.tsx` (cleaning schedule)
- `MonthlySummaryWidget.tsx` (monthly overview bar + links)

## Architecture

### Dashboard Page (`app/dashboard/page.tsx`)
- Remains the data-fetching owner (all 4 Firestore listeners stay here)
- Reads `dashboard_widgets` from localStorage via a `useDashboardWidgets` hook
- Renders widgets in `visibleWidgets` order by looking up each `WidgetId` in the registry
- Passes data (expenses, tasks, cleaning, users, derived stats) as props to each widget
- Edit state (toggle on/off) lives here

### `useDashboardWidgets` hook (`lib/hooks/useDashboardWidgets.ts`)
- Reads/writes `dashboard_widgets` from localStorage
- Exposes: `visibleWidgets`, `hiddenWidgets`, `reorderWidgets(from, to)`, `removeWidget(id)`, `addWidget(id)`, `resetToDefaults()`
- Returns default order when no localStorage key exists

### `DashboardWidget` wrapper (`app/dashboard/components/DashboardWidget.tsx`)
- Renders each widget's content inside the existing card styling
- In edit mode: shows drag handle (≡) + remove button (✕)
- Uses `useSortable` from `@dnd-kit/sortable` for drag-and-drop
- Animates out with Framer Motion when removed

### Edit Mode
- **Toggle button**: "Edit Dashboard" in the top right area of the page
- **Active state**: all widgets get drag handles + ✕ buttons + edit-mode border glow
- **Remove flow**: click ✕ → widget animates out → ID moves from `visibleWidgets` → user can re-add from drawer
- **Add Widget panel**: a slide-in drawer showing hidden widgets with ➕ buttons
- **Done button**: saves state to localStorage, exits edit mode

### Dependencies
Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (grid drag-and-drop).

## File Structure (new/changed)

```
app/dashboard/
├── page.tsx                          # CHANGED — data fetching + widget rendering + edit mode
├── components/
│   ├── DashboardWidget.tsx            # NEW — wrapper shell (drag handle, remove btn, edit overlay)
│   ├── AddWidgetPanel.tsx             # NEW — slide-in panel to add hidden widgets
│   └── widgets/
│       ├── StatsWidget.tsx            # NEW — extracted stat cards
│       ├── QuickActionsWidget.tsx     # NEW — extracted quick actions
│       ├── ActivityWidget.tsx         # NEW — extracted activity feed
│       ├── RentCountdownWidget.tsx    # NEW — extracted rent countdown
│       ├── TasksWidget.tsx            # NEW — extracted my tasks
│       ├── CleaningWidget.tsx         # NEW — extracted cleaning schedule
│       └── MonthlySummaryWidget.tsx   # NEW — extracted monthly summary
lib/
└── hooks/
    └── useDashboardWidgets.ts        # NEW — localStorage read/write + reorder helpers
```

## Layout Behavior

- **Desktop (lg+)**: 2-column grid — left column 2/3, right column 1/3. dnd-kit `rectSorting` strategy handles cross-column drag.
- **Mobile (< lg)**: single column stack. Drag-and-drop works vertically.
- Widgets that were in the right column stay right on desktop unless dragged to the left.
- Grid uses CSS Grid (`grid-template-columns`) — dnd-kit containers map to grid cells.

## Edge Cases

- **All widgets removed**: show "Your dashboard is empty — add widgets" with an Add Widget button
- **No localStorage key**: fall back to default order with all visible
- **Unknown widget ID in localStorage**: silently ignore (resilience during refactors)
- **Rapid remove/add**: debounce localStorage writes using a flush-on-done approach (save only when edit mode exits)
- **Widget with no data**: each widget handles its own empty state internally (existing `EmptyState` usage preserved)

## Future Considerations (not implemented now)

- Widget sizing options (1×1, 2×1, 1×2)
- Custom note/embed widget
- Per-flat shared widgets (pinned announcements)
- Firestore sync for cross-device layout
