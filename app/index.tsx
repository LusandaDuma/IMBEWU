/**
 * @fileoverview Landing page - redirects based on auth status with modern loading state
 */

import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { Sprout } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';

const roleRoutes: Record<UserRole, string> = {
  admin: '/admin',
  coordinator: '/coordinator',
  student: '/student',
  independent_grower: '/independent_grower',
  program_coordinator: '/program_coordinator',
};

export default function Index() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
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
  }, [isLoading]);

  if (isLoading) {
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
              Loading your learning experience
            </Text>

            <ActivityIndicator size="large" color="#16a34a" />

            <View className="flex-row mt-8 gap-2">
              <View
                className="w-2 h-2 rounded-full bg-primary-500"
                style={{
                  opacity: 0.5,
                }}
              />
              <View
                className="w-2 h-2 rounded-full bg-primary-500"
                style={{
                  opacity: 0.5,
                }}
              />
              <View
                className="w-2 h-2 rounded-full bg-primary-500"
                style={{
                  opacity: 0.5,
                }}
              />
            </View>
          </Animated.View>

          <Text className="absolute bottom-12 text-slate-500 text-xs text-center max-w-xs">
            Connecting to your personalized learning path...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  const route = user ? roleRoutes[user.role] : '/auth/login';
  return <Redirect href={route as any} />;
}
