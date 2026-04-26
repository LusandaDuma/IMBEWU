/**
 * @fileoverview Calm empty canvas — icon halo, generous space, slim CTA.
 */

import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Button } from '../atoms/Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'light' | 'dark';
  testID?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'light',
  testID,
}: EmptyStateProps) {
  // Grey app canvas: dark text for both variants (no white titles on grey).
  const titleCls = 'text-black';
  const descCls = 'text-earth-700';
  const halo = 'bg-transparent';
  const ic = '#57534e';

  return (
    <View testID={testID} className="items-center justify-center py-16 px-10">
      <View className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${halo}`}>
        <Icon size={36} color={ic} strokeWidth={1.25} />
      </View>
      <Text className={`text-lg font-light text-center tracking-tight ${titleCls}`}>{title}</Text>
      <Text className={`text-sm text-center mt-3 leading-6 max-w-xs font-light ${descCls}`}>{description}</Text>
      {actionLabel && onAction ? (
        <View className="mt-10 w-full max-w-[240px]">
          <Button label={actionLabel} onPress={onAction} fullWidth variant="primary" size="md" />
        </View>
      ) : null}
    </View>
  );
}
