/**
 * @fileoverview Lesson list rows — divider-only separation, no panels.
 */

import { CheckCircle, Lock, Play } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

export interface LessonRowProps {
  index: number;
  title: string;
  durationMins?: number | null;
  state: 'locked' | 'open' | 'done';
  onPress?: () => void;
  surface?: 'light' | 'dark';
  testID?: string;
}

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
    state === 'done' ? '#16a34a' : state === 'locked' ? '#a8a29e' : '#16a34a';

  const titleCls = 'text-black';
  const subCls = 'text-earth-700';

  const iconWrap = 'bg-primary-500/8';

  const row = (
    <View
      className={`flex-row items-center py-3 mb-0 border-b border-earth-400/30 ${
        state === 'locked' ? 'opacity-45' : ''
      }`}
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
    <View testID={testID} style={{ pointerEvents: 'none' }}>
      {row}
    </View>
  );
}
