/**
 * @fileoverview Search field that sits on the page — underline only, no pill box.
 */

import type { LucideIcon } from 'lucide-react-native';
import { TextInput, View } from 'react-native';

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
  const ph = variant === 'dark' ? '#78716c' : '#a8a29e';
  const tx = 'text-black';
  const ic = variant === 'dark' ? '#57534e' : '#78716c';

  return (
    <View
      className="flex-row items-center border-b border-earth-400/40 pb-3 pt-1 bg-transparent"
      testID={testID}
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
