/**
 * @fileoverview Authentication state management with Zustand
 */

import type { Profile, UserRole } from '@/types';
import { create } from 'zustand';

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  setUser: (user: Profile | null) => {
    set({ 
      user, 
      isAuthenticated: !!user,
      isLoading: false,
    });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  logout: () => {
    set({ 
      user: null, 
      isAuthenticated: false,
      isLoading: false,
    });
  },
  
  hasRole: (roles: UserRole[]) => {
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.role);
  },
}));
