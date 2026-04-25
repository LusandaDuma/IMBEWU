/**
 * @fileoverview Soft status chips — pigment only, no rims.
 */

import { Text, View } from 'react-native';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'accent';

const styles: Record<BadgeVariant, { box: string; text: string }> = {
  success: { box: 'bg-primary-600', text: 'text-white' },
  warning: { box: 'bg-earth-300', text: 'text-black' },
  danger: { box: 'bg-red-600', text: 'text-white' },
  info: { box: 'bg-earth-300', text: 'text-black' },
  neutral: { box: 'bg-earth-200', text: 'text-black' },
  primary: { box: 'bg-primary-600/90', text: 'text-white' },
  accent: { box: 'bg-primary-700', text: 'text-white' },
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
