/**
 * @fileoverview Editorial header — airy type, whisper back control.
 */

import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  variant?: 'light' | 'dark' | 'transparent';
  testID?: string;
}

export function ScreenHeader({ title, subtitle, onBack, rightSlot, variant = 'light', testID }: ScreenHeaderProps) {
  const titleCls =
    variant === 'dark' ? 'text-white' : variant === 'transparent' ? 'text-white' : 'text-earth-900';
  const subCls =
    variant === 'dark' ? 'text-slate-400' : variant === 'transparent' ? 'text-white/75' : 'text-earth-500';

  const backTint = variant === 'light' ? 'bg-earth-900/5' : 'bg-white/10';

  return (
    <View testID={testID} className="pt-3 pb-6 px-5">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-start flex-1 min-w-0">
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${backTint}`}
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color={variant === 'light' ? '#57534e' : '#ffffff'} strokeWidth={1.5} />
            </TouchableOpacity>
          ) : null}
          <View className="flex-1 min-w-0">
            <Text
              className={`text-2xl font-light tracking-tight ${titleCls}`}
              style={{ letterSpacing: -0.3 }}
              numberOfLines={2}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text className={`text-sm mt-2 leading-5 font-light ${subCls}`} numberOfLines={3}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {rightSlot ? <View className="ml-2 pt-0.5">{rightSlot}</View> : null}
      </View>
    </View>
  );
}
