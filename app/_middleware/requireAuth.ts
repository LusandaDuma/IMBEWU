/**
 * @fileoverview Auth guard hook for protected screens.
 */

import { useAuthStore } from '@/store/auth';

export function requireAuth() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) {
    return { isReady: false, redirectTo: null as string | null };
  }

  if (!session) {
    return { isReady: false, redirectTo: '/auth/login' };
  }

  return { isReady: true, redirectTo: null as string | null };
}
