/**
 * @fileoverview Root layout with providers
 */

import 'react-native-reanimated';
import '../global.css';

import { getSession } from '@/services/authService';
import { getProfile, supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Sprout } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setLoading } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const isMountedRef = useRef(false);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function initAuth() {
      try {
        const { data: session } = await getSession();

        if (!isMountedRef.current) return;

        if (session?.user) {
          const profile = await getProfile(session.user.id);
          if (profile && isMountedRef.current) {
            setAuth({ user: session.user, profile, session });
            return;
          }
        }

        clearAuth();
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMountedRef.current) {
          clearAuth();
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setIsReady(true);
        }
      }
    }

    initAuth();
  }, [setAuth, clearAuth, setLoading]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!isMountedRef.current) return;
      
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        if (profile && isMountedRef.current) {
          setAuth({ user: session.user, profile, session });
        }
      } else {
        clearAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuth, clearAuth]);

  useEffect(() => {
    if (!isReady) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center">
          <Animated.View
            style={[
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
            className="items-center"
          >
            <View className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 items-center justify-center mb-6 shadow-2xl">
              <Sprout size={48} color="white" strokeWidth={1.5} />
            </View>

            <Text className="text-3xl font-bold text-white mb-2">Imbewu</Text>
            <Text className="text-slate-300 text-center text-base mb-12 max-w-xs">
              Initializing your learning platform
            </Text>

            <ActivityIndicator size="large" color="#22c55e" />

            <View className="flex-row mt-8 gap-2">
              <View className="w-2 h-2 rounded-full bg-primary-500" style={{ opacity: 0.5 }} />
              <View className="w-2 h-2 rounded-full bg-primary-500" style={{ opacity: 0.5 }} />
              <View className="w-2 h-2 rounded-full bg-primary-500" style={{ opacity: 0.5 }} />
            </View>
          </Animated.View>

          <Text className="absolute bottom-12 text-slate-500 text-xs text-center max-w-xs px-6">
            Setting up your personalized learning experience
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <View className="flex-1">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="course" />
            <Stack.Screen name="fieldwise" />
            <Stack.Screen name="nolwazi" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="student" />
            <Stack.Screen name="coordinator" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="independent" />
          </Stack>
          <StatusBar style="light" translucent />
        </AuthProvider>
      </QueryClientProvider>
    </View>
  );
}