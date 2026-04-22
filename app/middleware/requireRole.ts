/**
 * @fileoverview Role guard hook for role-protected screens.
 */

import { Redirect } from 'expo-router';

import type { UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';

export function requireRole(allowedRoles: UserRole[]) {
  const { role, isLoading } = useAuthStore();

  if (isLoading) {
    return { isReady: false, redirect: null };
  }

  if (!role) {
    return { isReady: false, redirect: <Redirect href="/auth/login" /> };
  }

  if (!allowedRoles.includes(role)) {
    return { isReady: false, redirect: <Redirect href="/" /> };
  }

  return { isReady: true, redirect: null };
}
