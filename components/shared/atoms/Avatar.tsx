/**
 * @fileoverview Initials halo — pigment wash, no ring.
 */

import { Text, View } from 'react-native';

const sizes = {
  sm: { box: 'w-9 h-9 rounded-full', text: 'text-xs' },
  md: { box: 'w-12 h-12 rounded-full', text: 'text-sm' },
  lg: { box: 'w-16 h-16 rounded-full', text: 'text-base' },
} as const;

export interface AvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  size?: keyof typeof sizes;
  tone?: 'primary' | 'accent' | 'slate';
  testID?: string;
}

export function Avatar({ firstName, lastName, size = 'md', tone = 'primary', testID }: AvatarProps) {
  const a = (firstName?.trim()?.[0] ?? '?').toUpperCase();
  const b = (lastName?.trim()?.[0] ?? '').toUpperCase();
  const initials = `${a}${b}` || '?';
  const bg =
    tone === 'accent'
      ? 'bg-accent-500/15'
      : tone === 'slate'
        ? 'bg-slate-500/12'
        : 'bg-primary-500/14';
  const fg = tone === 'accent' ? 'text-accent-900' : tone === 'slate' ? 'text-slate-700' : 'text-primary-900';
  const s = sizes[size];
  return (
    <View
      testID={testID}
      accessibilityLabel={`Avatar ${initials}`}
      className={`items-center justify-center ${bg} ${s.box}`}
    >
      <Text className={`font-medium tracking-wide ${fg} ${s.text}`}>{initials}</Text>
    </View>
  );
}
