/**
 * @fileoverview Whisper-thin progress — soft track, luminous fill.
 */

import { Text, View } from 'react-native';

export type ProgressTone = 'primary' | 'accent' | 'slate';

const fill: Record<ProgressTone, string> = {
  primary: 'bg-primary-500/85',
  accent: 'bg-accent-500/85',
  slate: 'bg-slate-400/80',
};

const track: Record<ProgressTone, string> = {
  primary: 'bg-primary-500/12',
  accent: 'bg-accent-500/12',
  slate: 'bg-slate-400/15',
};

export interface ProgressBarProps {
  value: number;
  tone?: ProgressTone;
  heightClass?: string;
  showLabel?: boolean;
  testID?: string;
}

export function ProgressBar({
  value,
  tone = 'primary',
  heightClass = 'h-1',
  showLabel,
  testID,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <View testID={testID} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <View className={`w-full rounded-full overflow-hidden ${track[tone]} ${heightClass}`}>
        <View className={`${fill[tone]} h-full rounded-full`} style={{ width: `${pct}%` }} />
      </View>
      {showLabel ? (
        <Text className="text-earth-500/90 text-xs font-light tracking-wide mt-2">
          {Math.round(pct)}% complete
        </Text>
      ) : null}
    </View>
  );
}
