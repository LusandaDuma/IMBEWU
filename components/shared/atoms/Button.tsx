/**
 * @fileoverview Slim luxury actions — no hard edges, soft depth.
 */

import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Platform, Text, TouchableOpacity, type TouchableOpacityProps } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 active:opacity-90',
  secondary: 'bg-earth-300 active:bg-earth-400',
  outline: 'bg-primary-500/10 active:bg-primary-500/18',
  ghost: 'bg-transparent active:bg-earth-500/8',
  danger: 'bg-red-600/95 active:opacity-90',
  accent: 'bg-primary-700 active:opacity-90',
};

const textClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-black',
  outline: 'text-primary-700',
  ghost: 'text-black',
  danger: 'text-white',
  accent: 'text-white',
};

/** Pill profile, minimal vertical padding = thin luxury control. */
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-5 py-2 rounded-full',
  md: 'px-7 py-2.5 rounded-full',
  lg: 'px-8 py-3 rounded-full',
};

const textSize: Record<ButtonSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const softShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      }
    : { elevation: 0 };

const filledShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#14532d',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      }
    : { elevation: 3 };

export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  fullWidth?: boolean;
  testID?: string;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth,
  className = '',
  testID,
  ...rest
}: ButtonProps) {
  const busy = isLoading || disabled;
  const muted =
    variant === 'outline' || variant === 'ghost' || variant === 'secondary' ? '#166534' : '#ffffff';
  const filled = variant === 'primary' || variant === 'danger' || variant === 'accent';
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!busy }}
      disabled={busy}
      className={`flex-row items-center justify-center ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${disabled && !isLoading ? 'opacity-45' : ''} ${className}`}
      style={filled ? filledShadow : softShadow}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' || variant === 'secondary' ? '#15803d' : '#ffffff'}
        />
      ) : (
        <>
          {LeftIcon ? (
            <LeftIcon size={size === 'sm' ? 16 : 18} color={muted} style={{ marginRight: 8 }} strokeWidth={2} />
          ) : null}
          <Text className={`font-medium tracking-wide ${textClasses[variant]} ${textSize[size]}`}>{label}</Text>
          {RightIcon ? (
            <RightIcon size={size === 'sm' ? 16 : 18} color={muted} style={{ marginLeft: 8 }} strokeWidth={2} />
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
}
