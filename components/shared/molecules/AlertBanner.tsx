/**
 * @fileoverview Floating notice — tinted glass, no stroke.
 */

import { X } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

export type AlertBannerVariant = 'error' | 'success' | 'warning' | 'info';

const map: Record<AlertBannerVariant, { box: string; text: string; icon: string }> = {
  error: { box: 'bg-red-100', text: 'text-black', icon: '#b91c1c' },
  success: { box: 'bg-primary-600', text: 'text-white', icon: '#ffffff' },
  warning: { box: 'bg-earth-300', text: 'text-black', icon: '#44403c' },
  info: { box: 'bg-earth-200', text: 'text-black', icon: '#44403c' },
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
      className={`flex-row items-center rounded-3xl px-5 py-3.5 mb-5 ${s.box}`}
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
