/**
 * @fileoverview Profile service functions for auth-linked profile rows.
 */

import supabase from '@/services/supabase';
import type { Profile, UserRole } from '@/types';

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Fetch a user profile by auth user ID.
 * @param userId - Auth user ID.
 * @returns Profile row when found.
 */
export async function getProfile(userId: string): Promise<ServiceResult<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, language, is_active, last_login, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Profile, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch profile.',
    };
  }
}

/**
 * Create or update a profile row after sign-up.
 * @param input - Profile creation payload.
 * @returns Upserted profile row.
 */
export async function createProfile(input: {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  language?: string;
}): Promise<ServiceResult<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: input.id,
          first_name: input.firstName,
          last_name: input.lastName,
          role: input.role,
          language: input.language ?? 'en',
        },
        { onConflict: 'id' }
      )
      .select('id, first_name, last_name, role, language, is_active, last_login, updated_at')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Profile, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create profile.',
    };
  }
}
