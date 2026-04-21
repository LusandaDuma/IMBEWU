/**
 * @fileoverview Comprehensive color system for the Imbewu app
 * Following modern design principles with dark and light themes
 */

// Primary Green - Main brand color
const primaryColors = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#145231',
};

// Slate/Gray - Neutral palette for dark theme
const slateColors = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
};

// Secondary colors
const secondaryColors = {
  blue: '#3b82f6',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  orange: '#f97316',
  red: '#ef4444',
  rose: '#f43f5e',
  purple: '#a855f7',
  indigo: '#6366f1',
};

// Status colors
const statusColors = {
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export const lightTheme = {
  // Primary
  primary: primaryColors[600],
  primaryLight: primaryColors[50],
  primaryDark: primaryColors[900],

  // Text
  text: '#000000',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',

  // Background
  background: '#ffffff',
  backgroundSecondary: '#f9fafb',
  backgroundTertiary: '#f3f4f6',

  // Borders
  border: '#e5e7eb',
  borderLight: '#f3f4f6',

  // Cards
  card: '#ffffff',
  cardHover: '#f9fafb',

  // Status
  success: statusColors.success,
  error: statusColors.error,
  warning: statusColors.warning,
  info: statusColors.info,

  // Tint (legacy)
  tint: primaryColors[600],
  tabIconDefault: '#ccc',
  tabIconSelected: primaryColors[600],
};

export const darkTheme = {
  // Primary
  primary: primaryColors[500],
  primaryLight: primaryColors[400],
  primaryDark: primaryColors[700],

  // Text
  text: '#ffffff',
  textSecondary: '#e2e8f0',
  textTertiary: '#cbd5e1',

  // Background
  background: slateColors[900],
  backgroundSecondary: slateColors[800],
  backgroundTertiary: slateColors[700],

  // Borders
  border: slateColors[700],
  borderLight: slateColors[600],

  // Cards
  card: slateColors[800],
  cardHover: slateColors[700],

  // Status
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',

  // Tint (legacy)
  tint: primaryColors[500],
  tabIconDefault: slateColors[600],
  tabIconSelected: primaryColors[500],
};

// Unified export with default dark theme (app's primary theme)
export default {
  light: lightTheme,
  dark: darkTheme,
  
  // Commonly used across app
  primary: primaryColors,
  slate: slateColors,
  secondary: secondaryColors,
  status: statusColors,
  
  // Direct access to dark theme as default
  text: darkTheme.text,
  background: darkTheme.background,
  tint: darkTheme.tint,
  tabIconDefault: darkTheme.tabIconDefault,
  tabIconSelected: darkTheme.tabIconSelected,
};
