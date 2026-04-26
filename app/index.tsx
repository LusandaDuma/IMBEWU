/**
 * @fileoverview App entry — guests see the public course catalog; signed-in users go to their dashboard.
 */

import { PublicCatalogHome } from '@/components/screens/PublicCatalogHome';
import { getHomeHrefForRole } from '@/constants/routing';
import { APP_BACKGROUND_COLOR } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Image, Text, View } from 'react-native';

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
        colors={[APP_BACKGROUND_COLOR, APP_BACKGROUND_COLOR]}
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
            <Image
              source={require('../assets/images/logo.png')}
              style={{ width: 224, height: 80, marginBottom: 16 }}
              resizeMode="contain"
            />

            <Image
              source={require('../assets/images/name.png')}
              style={{ width: 192, height: 48, marginBottom: 8 }}
              resizeMode="contain"
            />
            <Text className="text-black text-center text-base mb-12 max-w-xs font-light">
              Loading your learning experience
            </Text>

            <ActivityIndicator size="large" color="#16a34a" />
          </Animated.View>

          <Text className="absolute bottom-12 text-earth-800 text-xs text-center max-w-xs font-light px-6">
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
