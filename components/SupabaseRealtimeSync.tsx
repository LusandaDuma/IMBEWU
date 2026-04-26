/**
 * @fileoverview Subscribes to Supabase Realtime and invalidates React Query + profile when
 * relevant rows change. Requires Realtime enabled on the subscribed tables in Supabase.
 *
 * Subscriptions are keyed on userId (stable), not session.user, to avoid recreating
 * the channel on every token refresh.
 */

import { getProfile } from '@/services/profileService';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const INVALIDATION_DEBOUNCE_MS = 500;

function invalidateForLearner(queryClient: QueryClient, userId: string) {
  queryClient.invalidateQueries({ queryKey: ['student-enrolments'] });
  queryClient.invalidateQueries({ queryKey: ['independent-enrolments'] });
  queryClient.invalidateQueries({ queryKey: ['student-enrolments', userId] });
  queryClient.invalidateQueries({ queryKey: ['independent-enrolments', userId] });
  queryClient.invalidateQueries({ queryKey: ['student-course-progress', userId] });
  queryClient.invalidateQueries({ queryKey: ['independent-course-progress', userId] });
  queryClient.invalidateQueries({ queryKey: ['lesson-progress', userId] });
  queryClient.invalidateQueries({ queryKey: ['student-achievements', userId] });
  queryClient.invalidateQueries({ queryKey: ['independent-achievements', userId] });
}

function invalidateForCoordinator(queryClient: QueryClient, userId: string) {
  queryClient.invalidateQueries({ queryKey: ['coordinator-classes', userId] });
  queryClient.invalidateQueries({ queryKey: ['coordinator-analytics', userId] });
  queryClient.invalidateQueries({ queryKey: ['class'] });
  queryClient.invalidateQueries({ queryKey: ['class-members'] });
  queryClient.invalidateQueries({ queryKey: ['class-lessons'] });
  queryClient.invalidateQueries({ queryKey: ['class-course'] });
}

function invalidateForAdmin(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
  queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  queryClient.invalidateQueries({ queryKey: ['admin-dashboard-analytics'] });
  queryClient.invalidateQueries({ queryKey: ['admin-activity-feed'] });
}

function invalidatePublicCourseQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['public-course'] });
  queryClient.invalidateQueries({ queryKey: ['public-course-lessons'] });
  queryClient.invalidateQueries({ queryKey: ['course'] });
  queryClient.invalidateQueries({ queryKey: ['course-lessons'] });
  queryClient.invalidateQueries({ queryKey: ['coordinator-course'] });
  queryClient.invalidateQueries({ queryKey: ['available-courses'] });
  queryClient.invalidateQueries({ queryKey: ['explore-courses'] });
  queryClient.invalidateQueries({ queryKey: ['courses', 'published'] });
}

async function syncProfileFromServer(userId: string) {
  const { data: profile, error } = await getProfile(userId);
  if (error || !profile) {
    return;
  }
  useAuthStore.getState().setProfile(profile);
}

type ScheduleInvalidate = (action: (qc: QueryClient) => void) => void;

function setupChannel(
  userId: string,
  role: UserRole,
  schedule: ScheduleInvalidate
): ReturnType<typeof supabase.channel> {
  const ch = supabase.channel(`app-sync-${userId}`);

  ch.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => {
    schedule((qc) => {
      void syncProfileFromServer(userId);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    });
  });

  if (role === 'student' || role === 'independent') {
    ch.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'course_enrolments', filter: `user_id=eq.${userId}` },
      () => schedule((qc) => invalidateForLearner(qc, userId))
    ).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lesson_progress', filter: `user_id=eq.${userId}` },
      () => schedule((qc) => invalidateForLearner(qc, userId))
    );
  }

  if (role === 'coordinator') {
    ch.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'classes', filter: `created_by=eq.${userId}` },
      () => schedule((qc) => invalidateForCoordinator(qc, userId))
    ).on('postgres_changes', { event: '*', schema: 'public', table: 'class_members' }, () => {
      schedule((qc) => invalidateForCoordinator(qc, userId));
    });
  }

  if (role === 'admin') {
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
      schedule((qc) => invalidateForAdmin(qc));
    })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        schedule((qc) => {
          invalidateForAdmin(qc);
          invalidatePublicCourseQueries(qc);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_members' }, () => {
        schedule((qc) => invalidateForAdmin(qc));
      });
  } else {
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
      schedule((qc) => invalidatePublicCourseQueries(qc));
    });
  }

  return ch;
}

export function SupabaseRealtimeSync() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const role = useAuthStore((s) => s.role);
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingActions = useRef<((qc: QueryClient) => void)[]>([]);

  const schedule: ScheduleInvalidate = useCallback(
    (action) => {
      pendingActions.current.push(action);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        const batch = pendingActions.current;
        pendingActions.current = [];
        for (const fn of batch) {
          fn(queryClient);
        }
      }, INVALIDATION_DEBOUNCE_MS);
    },
    [queryClient]
  );

  useEffect(() => {
    if (!userId || !role) {
      if (channelRef.current) {
        try {
          void supabase.removeChannel(channelRef.current);
        } catch {
          // ignore
        }
        channelRef.current = null;
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      pendingActions.current = [];
      return;
    }

    if (Platform.OS === 'web') {
      return;
    }

    if (channelRef.current) {
      try {
        void supabase.removeChannel(channelRef.current);
      } catch {
        // ignore
      }
    }

    let ch: ReturnType<typeof supabase.channel> | null = null;
    try {
      ch = setupChannel(userId, role, schedule);
      ch.subscribe();
      channelRef.current = ch;
    } catch (e) {
      console.warn('[SupabaseRealtimeSync] Realtime subscription failed', e);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      pendingActions.current = [];
      if (channelRef.current) {
        try {
          void supabase.removeChannel(channelRef.current);
        } catch {
          // ignore
        }
        channelRef.current = null;
      }
    };
  }, [userId, role, queryClient, schedule]);

  return null;
}
