/**
 * @fileoverview Persisted authentication state with role/profile helpers.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Profile, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSession: (session: Session | null) => void;
  setAuth: (payload: { user: User; profile: Profile; session: Session }) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      role: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set((state) => ({
          user,
          isAuthenticated: Boolean(user && state.session),
        })),

      setProfile: (profile) =>
        set({
          profile,
          role: profile?.role ?? null,
        }),

      setSession: (session) =>
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: Boolean(session?.user),
        }),

      setAuth: ({ user, profile, session }) =>
        set({
          user,
          profile,
          role: profile.role,
          session,
          isAuthenticated: true,
          isLoading: false,
        }),

      clearAuth: () =>
        set({
          user: null,
          profile: null,
          role: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
      logout: () =>
        set({
          user: null,
          profile: null,
          role: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      hasRole: (roles) => {
        const role = get().role;
        if (!role) return false;
        return roles.includes(role);
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        role: state.role,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
