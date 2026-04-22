/**
 * @fileoverview Authentication state management with Zustand
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile, UserRole } from '@/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
      isAuthenticated: false,
      isLoading: true,

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user && !!get().session,
        });
      },

      setProfile: (profile: Profile | null) => {
        set({
          profile,
          role: profile?.role ?? null,
        });
      },

      setSession: (session: Session | null) => {
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
        });
      },

      setAuth: ({ user, profile, session }) => {
        set({
          user,
          profile,
          role: profile.role,
          session,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          profile: null,
          role: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      logout: () => {
        get().clearAuth();
      },

      hasRole: (roles: UserRole[]) => {
        const { role } = get();
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
    },
  ),
);
