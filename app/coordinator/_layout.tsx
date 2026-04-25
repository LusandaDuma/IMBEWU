/**
 * @fileoverview Coordinator layout with bottom tabs
 */

import { useAuthStore } from '@/store/auth';
import { APP_BACKGROUND_COLOR } from '@/constants/theme';
import { Redirect, Tabs } from 'expo-router';
import { BarChart3, BookOpen, User, Users } from 'lucide-react-native';

export default function CoordinatorLayout() {
  const { role, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  if (role !== 'coordinator') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: APP_BACKGROUND_COLOR,
        },
        tabBarStyle: {
          backgroundColor: APP_BACKGROUND_COLOR,
          borderTopColor: '#a8a29e',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#1c1917',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Classes',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="class/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="course/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
