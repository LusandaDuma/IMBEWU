/**
 * @fileoverview Role → Expo Router home routes (interface connection layer).
 * Paths must match `app/` route groups exactly.
 */

import type { UserRole } from '@/types';
import type { Href } from 'expo-router';

/** First screen each role lands on after authentication (tab root). */
export const ROLE_HOME_HREF = {
  admin: '/admin',
  coordinator: '/coordinator',
  student: '/student',
  independent: '/independent',
} as const satisfies Record<UserRole, Href>;

export function getHomeHrefForRole(role: UserRole): Href {
  return ROLE_HOME_HREF[role];
}
