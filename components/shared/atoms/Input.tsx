/**
 * @fileoverview Controlled text field with LMS focus states (NativeWind).
 */

import { TextInput, type TextInputProps } from 'react-native';

export interface InputProps extends TextInputProps {
  hasError?: boolean;
  testID?: string;
}

export function Input({ hasError, className = '', testID, ...rest }: InputProps) {
  return (
    <TextInput
      testID={testID}
      className={`flex-1 text-base text-earth-800 py-1 ${className}`}
      placeholderTextColor="#a8a29e"
      {...rest}
    />
  );
}
