/**
 * @fileoverview Coordinator layout with bottom tabs
 */

import { APP_BACKGROUND_COLOR, getTabBarStyle, TAB_ICON_SIZE } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';
import { Redirect, Tabs } from 'expo-router';
import { BarChart3, BookOpen, User, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Stack-only routes must not appear as bottom tab targets (names come from the file tree). */
function hideCoordinatorTabButton(routeName: string): boolean {
  if (routeName === 'class/[id]') {
    return true;
  }
  return routeName === 'course/[id]' || routeName.startsWith('course/[id]/');
}

export default function CoordinatorLayout() {
  const insets = useSafeAreaInsets();
  const { role, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  if (role !== 'coordinator') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: {
          backgroundColor: APP_BACKGROUND_COLOR,
        },
        tabBarStyle: getTabBarStyle(insets),
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarIconStyle: { marginTop: 2 },
        tabBarItemStyle: hideCoordinatorTabButton(route.name)
          ? { display: 'none' as const }
          : { paddingVertical: 2 },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#1c1917',
        ...(hideCoordinatorTabButton(route.name)
          ? { tabBarButton: () => null }
          : {}),
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Classes',
          tabBarIcon: ({ color }) => <Users size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color }) => <BookOpen size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <BarChart3 size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={TAB_ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
  );
}
