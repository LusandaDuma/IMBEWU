/**
 * @fileoverview Not found screen
 */

import { Link, Stack } from 'expo-router';
import { APP_BACKGROUND_COLOR } from '@/constants/theme';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: APP_BACKGROUND_COLOR }}>
        <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-6">
          <Text className="text-4xl font-bold text-primary-600">?</Text>
        </View>
        <Text className="text-2xl font-bold text-earth-800 mb-2">
          Page Not Found
        </Text>
        <Text className="text-earth-500 text-center mb-8">
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Link href="/" asChild>
          <TouchableOpacity className="flex-row items-center bg-primary-600 px-6 py-3 rounded-xl">
            <Home size={20} color="white" />
            <Text className="text-white font-semibold ml-2">
              Go Home
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}