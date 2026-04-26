/**
 * @fileoverview Client-only Copilot tools: navigation + sign-out. No server round-trip, strict allowlist.
 */

import { signOut as supabaseSignOut } from '@/services/authService';
import { useAuthStore } from '@/store/auth';
import type { Href } from 'expo-router';

const ALLOWED_PATH_PREFIXES = [
  '/',
  '/nolwazi',
  '/auth',
  '/course',
  '/student',
  '/independent',
  '/coordinator',
  '/admin',
] as const;

function normalizePath(path: string): string {
  const p = path.trim().split('?')[0] || '/';
  if (p.length > 1 && p.endsWith('/')) {
    return p.replace(/\/+$/, '');
  }
  return p;
}

/**
 * Rejects path traversal, schemes, and unknown route roots.
 */
export function isAllowedCopilotPath(path: string): boolean {
  const p = normalizePath(path);
  if (p.startsWith('//') || p.includes('..') || p.includes('://')) {
    return false;
  }
  if (!p.startsWith('/')) {
    return false;
  }
  if (p === '/' || p === '/nolwazi') {
    return true;
  }
  return ALLOWED_PATH_PREFIXES.some(
    (pre) => pre !== '/' && (p === pre || p.startsWith(`${pre}/`)),
  );
}

export function runCopilotNavigateTo(
  path: string,
  push: (href: Href) => void,
): { ok: boolean; navigated: boolean; path?: string; error?: string } {
  if (!isAllowedCopilotPath(path)) {
    return { ok: true, navigated: false, error: 'Path is not in the allowlist for assistant navigation.' };
  }
  const target = normalizePath(path) as Href;
  try {
    push(target);
    return { ok: true, navigated: true, path: String(target) };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Navigation failed';
    return { ok: true, navigated: false, error: message };
  }
}

/**
 * Sign out via existing Supabase + local store. No credentials in chat.
 */
export async function runCopilotSignOut(): Promise<{
  ok: boolean;
  signedOut: boolean;
  error?: string;
}> {
  const res = await supabaseSignOut();
  if (res.error) {
    return { ok: true, signedOut: false, error: res.error };
  }
  useAuthStore.getState().clearAuth();
  return { ok: true, signedOut: true };
}

export const CLIENT_ONLY_COPILOT_TOOLS = new Set(['navigateTo', 'signOut']);
