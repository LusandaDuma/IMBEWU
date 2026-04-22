/**
 * @fileoverview Search as a soft pill — blends on light or dark canvases.
 */

import type { LucideIcon } from 'lucide-react-native';
import { Platform, TextInput, View } from 'react-native';

const pillShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#1c1917',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 20,
      }
    : { elevation: 0 };

export interface SearchBarProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  icon: LucideIcon;
  variant?: 'light' | 'dark';
  testID?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search…',
  icon: Icon,
  variant = 'light',
  testID,
}: SearchBarProps) {
  const box = variant === 'dark' ? 'bg-white/8' : 'bg-white/75';
  const ph = variant === 'dark' ? '#94a3b8' : '#a8a29e';
  const tx = variant === 'dark' ? 'text-white' : 'text-earth-800';
  const ic = variant === 'dark' ? '#cbd5e1' : '#78716c';

  return (
    <View
      className={`flex-row items-center rounded-full px-5 py-3 ${box}`}
      testID={testID}
      style={variant === 'light' ? pillShadow : undefined}
    >
      <Icon size={18} color={ic} strokeWidth={1.75} />
      <TextInput
        className={`flex-1 ml-3 text-sm font-light ${tx}`}
        placeholder={placeholder}
        placeholderTextColor={ph}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
    </View>
  );
}
