/**
 * @fileoverview Auth guard hook for protected screens.
 */

import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/auth';

export function requireAuth() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return { isReady: false, redirect: null };
  }

  if (!session) {
    return { isReady: false, redirect: <Redirect href="/auth/login" /> };
  }

  return { isReady: true, redirect: null };
}
