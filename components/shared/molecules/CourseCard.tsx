/**
 * @fileoverview Course rows — inline on the canvas, separated by hairline dividers only.
 * When both `onPress` and `footer` are set, only the main body is pressable so footer actions stay independent.
 */

import type { ReactNode } from 'react';
import { COURSE_LOGO_THUMB } from '@/constants/courseBranding';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { ProgressBar } from '../atoms/ProgressBar';

export type CourseCardVariant = 'elevated' | 'dark' | 'flat' | 'solid';

/** All rows sit on the grey canvas — dark text. Use `Button` (green) for white label CTAs. */
const titleStyle: Record<CourseCardVariant, string> = {
  elevated: 'text-black',
  dark: 'text-black',
  flat: 'text-black',
  solid: 'text-black',
};
const subStyle: Record<CourseCardVariant, string> = {
  elevated: 'text-earth-800',
  dark: 'text-earth-800',
  flat: 'text-earth-800',
  solid: 'text-earth-800',
};
const metaStyle: Record<CourseCardVariant, string> = {
  elevated: 'text-earth-700',
  dark: 'text-earth-700',
  flat: 'text-earth-700',
  solid: 'text-earth-700',
};

const thumbBg: Record<CourseCardVariant, string> = {
  elevated: 'bg-primary-500/10',
  dark: 'bg-white/10',
  flat: 'bg-primary-500/10',
  solid: 'bg-white/15',
};

export interface CourseCardProps {
  title: string;
  description?: string | null;
  meta?: string;
  coverImageSource?: ImageSourcePropType;
  coverImageUri?: string | null;
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
  coverImageSource,
  coverImageUri,
  progress,
  variant = 'elevated',
  onPress,
  footer,
  testID,
}: CourseCardProps) {
  const titleCls = titleStyle[variant];
  const subCls = subStyle[variant];
  const metaCls = metaStyle[variant];
  const thumb = thumbBg[variant];

  const body = (
    <View className="flex-row">
      <View className={`w-16 h-16 rounded-2xl overflow-hidden items-center justify-center ${thumb}`}>
        <View className="w-full h-full items-center justify-center">
          {coverImageSource ? (
            <Image
              source={coverImageSource}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          ) : coverImageUri ? (
            <Image
              source={{ uri: coverImageUri }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={COURSE_LOGO_THUMB}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          )}
        </View>
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
            <ProgressBar value={progress} tone="primary" />
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

  const footerBlock = footer ? <View className="mt-4">{footer}</View> : null;
  const wrap = 'pt-2 pb-6 mb-1 border-b border-earth-400/35';

  if (onPress && footer) {
    return (
      <View testID={testID} className={wrap}>
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
        accessibilityRole="button"
      >
        {body}
        {footerBlock}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} className={wrap}>
      {body}
      {footerBlock}
    </View>
  );
}
