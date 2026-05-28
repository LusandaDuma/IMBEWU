/**
 * @fileoverview Role guard hook for role-protected screens.
 */

import type { UserRole } from '@/types';

export function requireRole(_allowedRoles: UserRole[]) {
  // Middleware runs outside React rendering; do not call React hooks here.
  return { isReady: false, redirectTo: '/auth/login' };
}

