/**
 * @fileoverview Root layout with providers
 */

import 'react-native-reanimated';
import '../global.css';

import { SupabaseRealtimeSync } from '@/components/SupabaseRealtimeSync';
import { NolwaziFab } from '@/components/shared';
import { BRAND_ICON } from '@/constants/brandAssets';
import { APP_BACKGROUND_COLOR } from '@/constants/theme';
import { getSession } from '@/services/authService';
import { getProfile } from '@/services/profileService';
import supabase from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, Text, View } from 'react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
      gcTime: 30 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // React Native: without NetInfo, onlineManager often stays "offline" and mutations never run.
      networkMode: 'always',
      retry: 0,
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
          const { data: profile } = await getProfile(session.user.id);
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
        const { data: profile } = await getProfile(session.user.id);
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
      const useNativeDriver = Platform.OS !== 'web';
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver,
        }),
      ]).start();
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#032f20' }}>
        <StatusBar style="light" />
        
        {/* Top bar */}
        <View style={{
          position: 'absolute', top: 52, left: 0, right: 0,
          flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'center', paddingHorizontal: 24,
        }}>
          <Text style={{
            color: 'rgba(201,168,76,0.9)', fontSize: 11,
            letterSpacing: 3, fontWeight: '700',
          }}>
            IMBEWU PREMIUM
          </Text>
          <View style={{
            borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)',
            borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
          }}>
            <Text style={{ color: '#C9A84C', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
              V1.0 LIVE
            </Text>
          </View>
        </View>

        {/* Center content */}
        <Animated.View style={{
          flex: 1, alignItems: 'center', justifyContent: 'center',
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}>
          {/* Concentric circles */}
          <View style={{
            width: 160, height: 160, borderRadius: 80,
            borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <View style={{
              width: 120, height: 120, borderRadius: 60,
              borderWidth: 1, borderColor: 'rgba(201,168,76,0.35)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <View style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: 'rgba(201,168,76,0.1)',
                borderWidth: 2, borderColor: '#C9A84C',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Image
                  source={BRAND_ICON}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          {/* Brand name */}
          <Text style={{
            color: 'white', fontSize: 36, letterSpacing: 12,
            fontWeight: '300', marginTop: 32, marginBottom: 8,
            fontFamily: 'serif',
          }}>
            IMBEWU
          </Text>

          {/* Animated loading text */}
          <Text style={{
            color: 'rgba(201,168,76,0.8)', fontSize: 13,
            fontStyle: 'italic', fontFamily: 'serif',
            marginBottom: 40, letterSpacing: 1,
          }}>
            Establishing secure botanical connection...
          </Text>

          {/* Progress bar */}
          <View style={{ width: 240, marginBottom: 12 }}>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <Text style={{
                color: 'rgba(255,255,255,0.4)', fontSize: 9,
                letterSpacing: 2, textTransform: 'uppercase',
              }}>
                INITIALIZATION PROGRESS
              </Text>
              <Text style={{ color: '#C9A84C', fontSize: 9, fontWeight: '700' }}>
                LOADING
              </Text>
            </View>
            <View style={{
              height: 2, backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 1, overflow: 'hidden',
            }}>
              <Animated.View style={{
                height: '100%', backgroundColor: '#C9A84C',
                borderRadius: 1, width: '75%',
              }} />
            </View>
          </View>
        </Animated.View>

        {/* Bottom text */}
        <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' }}>
          <Text style={{
            color: 'rgba(255,255,255,0.4)', fontSize: 9,
            letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12,
          }}>
            SETTING UP YOUR PERSONALIZED LEARNING EXPERIENCE
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: i === 1 ? '#C9A84C' : 'rgba(201,168,76,0.3)',
              }} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <View className="flex-1" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: APP_BACKGROUND_COLOR },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="course/[id]" />
            <Stack.Screen name="fieldwise" />
            <Stack.Screen name="nolwazi" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="student" />
            <Stack.Screen name="coordinator" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="independent" />
          </Stack>
          <NolwaziFab />
          <StatusBar style="light" translucent />
        </AuthProvider>
        <SupabaseRealtimeSync />
      </QueryClientProvider>
    </View>
  );
}