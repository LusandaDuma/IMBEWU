/**
 * @fileoverview Lesson rhythm — soft panels, no outlines.
 */

import { CheckCircle, Lock, Play } from 'lucide-react-native';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

export interface LessonRowProps {
  index: number;
  title: string;
  durationMins?: number | null;
  state: 'locked' | 'open' | 'done';
  onPress?: () => void;
  surface?: 'light' | 'dark';
  testID?: string;
}

const rowShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#1c1917',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
      }
    : { elevation: 1 };

export function LessonRow({
  index,
  title,
  durationMins,
  state,
  onPress,
  surface = 'dark',
  testID,
}: LessonRowProps) {
  const Icon = state === 'done' ? CheckCircle : state === 'locked' ? Lock : Play;
  const iconColor =
    surface === 'light'
      ? state === 'done'
        ? '#16a34a'
        : state === 'locked'
          ? '#a8a29e'
          : '#16a34a'
      : state === 'done'
        ? '#86efac'
        : state === 'locked'
          ? '#94a3b8'
          : '#bbf7d0';

  const shell =
    surface === 'light' ? 'bg-white/65' : 'bg-white/6';

  const titleCls = surface === 'light' ? 'text-earth-900' : 'text-white';
  const subCls = surface === 'light' ? 'text-earth-500' : 'text-slate-400';

  const iconWrap = surface === 'light' ? 'bg-primary-500/10' : 'bg-white/10';

  const row = (
    <View
      className={`flex-row items-center rounded-3xl p-4 mb-3 ${shell} ${state === 'locked' ? 'opacity-45' : ''}`}
      style={surface === 'light' ? rowShadow : undefined}
    >
      <View className={`w-11 h-11 rounded-full items-center justify-center ${iconWrap}`}>
        <Icon size={19} color={iconColor} strokeWidth={1.75} />
      </View>
      <View className="flex-1 ml-3.5 min-w-0">
        <Text className={`font-normal tracking-tight ${titleCls}`} numberOfLines={2}>
          {index + 1}. {title}
        </Text>
        {durationMins != null ? (
          <Text className={`text-xs mt-1 font-light ${subCls}`}>{durationMins} min</Text>
        ) : null}
      </View>
    </View>
  );

  if (state !== 'locked' && onPress) {
    return (
      <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.9}>
        {row}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} pointerEvents="none">
      {row}
    </View>
  );
}
