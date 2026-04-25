/**
 * @fileoverview Course surfaces that melt into the page — glass-soft, no rims.
 * When both `onPress` and `footer` are set, only the main body is pressable so footer actions stay independent.
 */

import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import { ProgressBar } from '../atoms/ProgressBar';

export type CourseCardVariant = 'elevated' | 'dark' | 'flat' | 'solid';

const shell: Record<CourseCardVariant, string> = {
  elevated: 'bg-earth-100 rounded-3xl',
  dark: 'bg-primary-700 rounded-3xl',
  flat: 'bg-earth-200 rounded-3xl',
  solid: 'bg-primary-600 rounded-3xl',
};

const glassShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#1c1917',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.06,
        shadowRadius: 32,
      }
    : { elevation: 2 };

export interface CourseCardProps {
  title: string;
  description?: string | null;
  meta?: string;
  coverImageUri?: string | null;
  placeholderIcon?: LucideIcon;
  progress?: number;
  variant?: CourseCardVariant;
  onPress?: () => void;
  footer?: ReactNode;
  testID?: string;
}

export function CourseCard({
  title,
  description,
  meta,
  coverImageUri,
  placeholderIcon: PlaceholderIcon,
  progress,
  variant = 'elevated',
  onPress,
  footer,
  testID,
}: CourseCardProps) {
  const titleCls = variant === 'dark' ? 'text-white' : 'text-earth-900';
  const subCls = variant === 'dark' ? 'text-white/90' : 'text-earth-700';
  const metaCls = variant === 'dark' ? 'text-white/80' : 'text-earth-600';

  const body = (
    <View className="flex-row">
      <View
        className={`w-16 h-16 rounded-2xl overflow-hidden items-center justify-center ${
          variant === 'dark' ? 'bg-white/8' : 'bg-primary-500/12'
        }`}
      >
        {coverImageUri ? (
          <Image source={{ uri: coverImageUri }} className="w-full h-full" resizeMode="cover" />
        ) : PlaceholderIcon ? (
          <PlaceholderIcon size={28} color={variant === 'dark' ? '#86efac' : '#16a34a'} strokeWidth={1.5} />
        ) : null}
      </View>
      <View className="flex-1 ml-4 min-w-0">
        <Text className={`text-base font-medium tracking-tight ${titleCls}`} numberOfLines={1}>
          {title}
        </Text>
        {description ? (
          <Text className={`text-sm mt-1.5 leading-5 ${subCls}`} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        {typeof progress === 'number' && progress > 0 ? (
          <View className="mt-3.5">
            <ProgressBar value={progress} tone={variant === 'dark' ? 'primary' : 'primary'} />
          </View>
        ) : null}
        {meta ? (
          <Text className={`text-xs mt-2 font-normal tracking-wide ${metaCls}`} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const footerBlock = footer ? <View className="mt-5">{footer}</View> : null;
  const wrap = `p-5 mb-4 ${shell[variant]}`;

  if (onPress && footer) {
    return (
      <View testID={testID} className={wrap} style={glassShadow}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.92} accessibilityRole="button">
          {body}
        </TouchableOpacity>
        {footerBlock}
      </View>
    );
  }

  if (onPress && !footer) {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        activeOpacity={0.92}
        className={wrap}
        style={glassShadow}
        accessibilityRole="button"
      >
        {body}
        {footerBlock}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} className={wrap} style={glassShadow}>
      {body}
      {footerBlock}
    </View>
  );
}
