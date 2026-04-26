/**
 * @fileoverview Quiet fields — tone shift on focus, zero outline noise.
 */

import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Input, type InputProps } from '../atoms/Input';

export interface FormFieldProps extends InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: LucideIcon;
  focused?: boolean;
  appearance?: 'light' | 'dark' | 'blend';
  endSlot?: ReactNode;
}

export function FormField({
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  focused,
  appearance = 'light',
  endSlot,
  className,
  ...inputProps
}: FormFieldProps) {
  const hasError = !!error;
  const isDark = appearance === 'dark';
  const isBlend = appearance === 'blend';

  const shell = isBlend
    ? hasError
      ? 'border-b-2 border-red-500/90 bg-transparent'
      : focused
        ? 'border-b-2 border-primary-600 bg-transparent'
        : 'border-b border-earth-400/45 bg-transparent'
    : isDark
      ? hasError
        ? 'bg-red-200'
        : focused
          ? 'bg-earth-100'
          : 'bg-earth-200'
      : hasError
        ? 'bg-red-500/8'
        : focused
          ? 'bg-white/95'
          : 'bg-earth-50/90';

  const labelCls = isDark ? 'text-earth-700' : 'text-earth-600';
  const helperCls = isDark || isBlend ? 'text-earth-600' : 'text-earth-500';
  const iconMuted = isDark || isBlend ? '#57534e' : '#78716c';
  const inputCls =
    isDark || isBlend ? `text-earth-900 ${className ?? ''}` : `text-earth-800 ${className ?? ''}`;

  const rowShape = isBlend
    ? 'flex-row items-center py-1 rounded-none px-0'
    : 'flex-row items-center rounded-full px-5 py-3';

  return (
    <View className="mb-4">
      {label ? (
        <Text className={`text-xs font-medium mb-2 tracking-[0.2em] uppercase ${labelCls}`}>{label}</Text>
      ) : null}
      <View className={`${rowShape} ${shell}`}>
        {LeftIcon ? (
          <LeftIcon
            size={20}
            color={focused ? '#16a34a' : hasError ? '#f87171' : iconMuted}
            style={{ marginRight: 12 }}
            strokeWidth={1.75}
          />
        ) : null}
        <Input
          {...inputProps}
          hasError={hasError}
          placeholderTextColor={isDark || isBlend ? '#78716c' : '#a8a29e'}
          className={inputCls}
        />
        {endSlot ? <View className="pl-1">{endSlot}</View> : null}
      </View>
      {error ? <Text className="text-red-400/95 text-xs mt-2 ml-2 font-normal tracking-wide">{error}</Text> : null}
      {!error && helperText ? (
        <Text className={`text-xs mt-2 ml-2 font-light tracking-wide ${helperCls}`}>{helperText}</Text>
      ) : null}
    </View>
  );
}
