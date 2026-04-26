/**
 * @fileoverview Floating notice — tinted glass, no stroke.
 */

import { X } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

export type AlertBannerVariant = 'error' | 'success' | 'warning' | 'info';

const map: Record<AlertBannerVariant, { box: string; text: string; icon: string }> = {
  error: { box: 'border-l-4 border-l-red-600 bg-transparent pl-3', text: 'text-earth-900', icon: '#b91c1c' },
  success: { box: 'border-l-4 border-l-primary-600 bg-transparent pl-3', text: 'text-earth-900', icon: '#15803d' },
  warning: { box: 'border-l-4 border-l-accent-600 bg-transparent pl-3', text: 'text-earth-900', icon: '#44403c' },
  info: { box: 'border-l-4 border-l-earth-500 bg-transparent pl-3', text: 'text-earth-800', icon: '#44403c' },
};

export interface AlertBannerProps {
  message: string;
  variant?: AlertBannerVariant;
  onDismiss?: () => void;
  testID?: string;
}

export function AlertBanner({ message, variant = 'info', onDismiss, testID }: AlertBannerProps) {
  const s = map[variant];
  return (
    <View
      testID={testID}
      className={`flex-row items-center py-2 mb-5 ${s.box}`}
      accessibilityRole="alert"
    >
      <Text className={`flex-1 text-sm font-light leading-5 ${s.text}`}>{message}</Text>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} hitSlop={12} accessibilityLabel="Dismiss">
          <X size={18} color={s.icon} strokeWidth={1.5} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
