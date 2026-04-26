import type { EdgeInsets } from 'react-native-safe-area-context';

/**
 * Global design tokens shared across route layouts.
 *
 * Theme: on **grey** (`APP_BACKGROUND`) use **black** / earth-800 body copy.
 * On **green** (primary) surfaces (e.g. `bg-primary-600` buttons) use **white** text.
 */
export const APP_BACKGROUND_COLOR = '#D6D6D6';

/** Pushes bottom tab content above the home indicator / Android gesture / nav bar. */
/** Non–safe-area min height for the tab bar (icons 28pt + label). Kept in sync with `getTabBarStyle`. */
export const TAB_BAR_BASE_HEIGHT = 68;

/** Icon size in bottom tabs (lucide uses this for width/height). */
export const TAB_ICON_SIZE = 28;

const FAB_GAP = 10;

/**
 * `bottom` offset for a fixed FAB so it sits above the tab bar (role layouts) or above the system home/gesture area only.
 * Pair with the same insets you use in `getTabBarStyle` for a given device.
 */
export function getNolwaziFabBottomOffset(insets: EdgeInsets, hasBottomTabBar: boolean): number {
  if (hasBottomTabBar) {
    return TAB_BAR_BASE_HEIGHT + insets.bottom + FAB_GAP;
  }
  return 20 + insets.bottom;
}

export function isRoleTabPathname(path: string | null | undefined): boolean {
  if (!path) {
    return false;
  }
  return (
    path === '/student' ||
    path.startsWith('/student/') ||
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path === '/coordinator' ||
    path.startsWith('/coordinator/') ||
    path === '/independent' ||
    path.startsWith('/independent/')
  );
}

export function getTabBarStyle(insets: EdgeInsets) {
  const paddingTop = 8;
  const paddingBottomInner = 8;
  const paddingBottom = paddingBottomInner + insets.bottom;
  return {
    backgroundColor: APP_BACKGROUND_COLOR,
    borderTopColor: '#a8a29e',
    borderTopWidth: 1,
    paddingTop,
    paddingBottom,
    minHeight: TAB_BAR_BASE_HEIGHT + insets.bottom,
  };
}

/** Dense list rows — hairline divider, no fill. */
export const surfaceListCard = 'py-4 border-b border-earth-400/35';

/** Settings-style list — no panel chrome; use plain `View` or this transparent wrapper. */
export const surfaceMenuShell = 'bg-transparent';

/** Section intro (course outline headers) — separator only. */
export const surfaceContentPanel = 'mb-6 pb-4 border-b border-earth-400/35';

/** Lesson body copy — no inset card. */
export const surfaceProse = 'mb-8';

/** Raw TextInputs in admin/coordinator — underline field, matches canvas. */
export const fieldPlain = 'border-b border-earth-400/50 bg-transparent py-3 px-0 text-earth-900';
