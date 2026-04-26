/**
 * @fileoverview Admin layout with bottom tabs
 */

import { APP_BACKGROUND_COLOR, getTabBarStyle, TAB_ICON_SIZE } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';
import { Redirect, Tabs } from 'expo-router';
import { BookOpen, LayoutDashboard, Settings, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const { role, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  if (role !== 'admin') {
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
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={TAB_ICON_SIZE} color={color} />,
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
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color }) => <Users size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users-new"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="courses/new"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="courses/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
