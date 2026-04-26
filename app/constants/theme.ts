/**
 * Global design tokens shared across route layouts.
 *
 * Theme: on **grey** (`APP_BACKGROUND`) use **black** / earth-800 body copy.
 * On **green** (primary) surfaces (e.g. `bg-primary-600` buttons) use **white** text.
 */
export const APP_BACKGROUND_COLOR = '#D6D6D6';

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
