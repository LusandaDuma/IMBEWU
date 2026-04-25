/**
 * @fileoverview Auth layout
 */

import { Stack } from 'expo-router';
import { APP_BACKGROUND_COLOR } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: APP_BACKGROUND_COLOR },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
