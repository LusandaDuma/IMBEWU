/**
 * @fileoverview Role guard hook for role-protected screens.
 */

import type { UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';

export function requireRole(allowedRoles: UserRole[]) {
  const { role, isLoading } = useAuthStore();

  if (isLoading) {
    return { isReady: false, redirectTo: null as string | null };
  }

  if (!role) {
    return { isReady: false, redirectTo: '/auth/login' };
  }

  if (!allowedRoles.includes(role)) {
    return { isReady: false, redirectTo: '/' };
  }

  return { isReady: true, redirectTo: null as string | null };
}
