/**
 * @fileoverview Shared app constants.
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  COORDINATOR: 'coordinator',
  STUDENT: 'student',
  INDEPENDENT: 'independent',
} as const;

export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'We could not sign you in. Check your email and password, then try again.',
  EMAIL_EXISTS: 'An account with this email already exists. Please sign in instead.',
  NETWORK: 'Network error. Please check your connection and try again.',
  UNKNOWN: 'Something went wrong. Please try again.',
} as const;
