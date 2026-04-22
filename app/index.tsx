/**
 * @fileoverview App entry — guests see the public course catalog; signed-in users go to their dashboard.
 */

import { PublicCatalogHome } from '@/components/screens/PublicCatalogHome';
import { getHomeHrefForRole } from '@/constants/routing';
import { useAuthStore } from '@/store/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { Sprout } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';

export default function Index() {
  const { profile, isAuthenticated, isLoading } = useAuthStore();
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
            <View className="w-24 h-24 rounded-3xl bg-primary-600/95 items-center justify-center mb-6">
              <Sprout size={48} color="white" strokeWidth={1.5} />
            </View>

            <Text className="text-3xl font-light text-white mb-2">Imbewu</Text>
            <Text className="text-slate-400 text-center text-base mb-12 max-w-xs font-light">
              Loading your learning experience
            </Text>

            <ActivityIndicator size="large" color="#16a34a" />
          </Animated.View>

          <Text className="absolute bottom-12 text-slate-600 text-xs text-center max-w-xs font-light px-6">
            Catalogue opens for everyone — sign in only when you enrol or learn
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (isAuthenticated && profile) {
    return <Redirect href={getHomeHrefForRole(profile.role)} />;
  }

  return <PublicCatalogHome />;
}
