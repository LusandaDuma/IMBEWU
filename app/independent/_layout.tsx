/**
 * @fileoverview Independent learner layout with bottom tabs
 */

import { APP_BACKGROUND_COLOR, getTabBarStyle, TAB_ICON_SIZE } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';
import { Redirect, Tabs } from 'expo-router';
import { Award, BookOpen, Compass, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function IndependentLayout() {
  const insets = useSafeAreaInsets();
  const { role, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  if (role !== 'independent') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: APP_BACKGROUND_COLOR,
        },
        tabBarStyle: getTabBarStyle(insets),
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarIconStyle: { marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#1c1917',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color }) => <BookOpen size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Compass size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <Award size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen name="course/[id]" options={{ href: null }} />
      <Tabs.Screen name="lesson/[id]" options={{ href: null }} />
    </Tabs>
  );
}
