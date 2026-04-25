/**
 * @fileoverview Student layout with bottom tabs
 */

import { useAuthStore } from '@/store/auth';
import { APP_BACKGROUND_COLOR } from '@/constants/theme';
import { Redirect, Tabs } from 'expo-router';
import { Award, BookOpen, GraduationCap, User } from 'lucide-react-native';

export default function StudentLayout() {
  const { role, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  if (role !== 'student') {
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
          title: 'My Courses',
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <GraduationCap size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievements',
          tabBarIcon: ({ color, size }) => (
            <Award size={size} color={color} />
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
      <Tabs.Screen name="course/[id]" options={{ href: null }} />
      <Tabs.Screen name="lesson/[id]" options={{ href: null }} />
    </Tabs>
  );
}
