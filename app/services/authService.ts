/**
 * @fileoverview Authentication service wrapper for Supabase auth operations.
 */

import type { Session } from '@supabase/supabase-js';

import type { UserRole } from '@/types';
import { AUTH_ERROR_MESSAGES } from '@/utils/constants';

import { supabase } from './supabase';

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

function mapAuthError(message?: string): string {
  const normalized = message?.toLowerCase() ?? '';

  if (normalized.includes('invalid login credentials')) {
    return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS;
  }

  if (normalized.includes('already registered') || normalized.includes('already exists')) {
    return AUTH_ERROR_MESSAGES.EMAIL_EXISTS;
  }

  if (normalized.includes('network') || normalized.includes('failed to fetch')) {
    return AUTH_ERROR_MESSAGES.NETWORK;
  }

  return AUTH_ERROR_MESSAGES.UNKNOWN;
}

/**
 * Sign up a user using email/password and profile metadata.
 */
export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: UserRole,
): Promise<ServiceResult<Session>> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role,
        },
      },
    });

    if (error) {
      return { data: null, error: mapAuthError(error.message) };
    }

    return { data: data.session, error: null };
  } catch (error) {
    return { data: null, error: mapAuthError(error instanceof Error ? error.message : undefined) };
  }
}

/**
 * Sign in a user using email/password.
 */
export async function signIn(email: string, password: string): Promise<ServiceResult<Session>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { data: null, error: mapAuthError(error.message) };
    }

    return { data: data.session, error: null };
  } catch (error) {
    return { data: null, error: mapAuthError(error instanceof Error ? error.message : undefined) };
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<ServiceResult<true>> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { data: null, error: mapAuthError(error.message) };
    }

    return { data: true, error: null };
  } catch (error) {
    return { data: null, error: mapAuthError(error instanceof Error ? error.message : undefined) };
  }
}

/**
 * Get the current auth session.
 */
export async function getSession(): Promise<ServiceResult<Session>> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { data: null, error: mapAuthError(error.message) };
    }

    return { data: data.session, error: null };
  } catch (error) {
    return { data: null, error: mapAuthError(error instanceof Error ? error.message : undefined) };
  }
}

/**
 * Refresh the current auth session.
 */
export async function refreshSession(): Promise<ServiceResult<Session>> {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return { data: null, error: mapAuthError(error.message) };
    }

    return { data: data.session, error: null };
  } catch (error) {
    return { data: null, error: mapAuthError(error instanceof Error ? error.message : undefined) };
  }
}

/**
 * Send a password reset email for the provided account.
 */
export async function requestPasswordReset(email: string): Promise<ServiceResult<true>> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return { data: null, error: mapAuthError(error.message) };
    }

    return { data: true, error: null };
  } catch (error) {
    return { data: null, error: mapAuthError(error instanceof Error ? error.message : undefined) };
  }
}
