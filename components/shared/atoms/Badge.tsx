/**
 * @fileoverview Soft status chips — pigment only, no rims.
 */

import { Text, View } from 'react-native';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'accent';

const styles: Record<BadgeVariant, { box: string; text: string }> = {
  success: { box: 'bg-primary-500/14', text: 'text-primary-800' },
  warning: { box: 'bg-accent-500/14', text: 'text-accent-900' },
  danger: { box: 'bg-red-500/12', text: 'text-red-800' },
  info: { box: 'bg-slate-500/12', text: 'text-slate-700' },
  neutral: { box: 'bg-earth-500/10', text: 'text-earth-700' },
  primary: { box: 'bg-primary-600/90', text: 'text-white' },
  accent: { box: 'bg-accent-500/90', text: 'text-white' },
};

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  testID?: string;
}

export function Badge({ label, variant = 'neutral', testID }: BadgeProps) {
  const s = styles[variant];
  return (
    <View testID={testID} className={`self-start px-3 py-1.5 rounded-full ${s.box}`}>
      <Text className={`text-[11px] font-medium tracking-[0.14em] uppercase ${s.text}`}>{label}</Text>
    </View>
  );
}
