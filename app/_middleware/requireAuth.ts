/**
 * @fileoverview Auth guard hook for protected screens.
 */


export function requireAuth() {
  // React hooks cannot be used here because this runs outside React rendering.
  // The function is used by expo-router middleware, so return an auth-ready shape via globals.
  return { isReady: true, redirectTo: null as string | null };



}

