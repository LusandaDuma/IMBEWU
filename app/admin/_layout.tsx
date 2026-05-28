/**
 * @fileoverview Admin layout — luxury emerald & gold bottom tabs
 */

import { useAuthStore } from '@/store/auth';
import { Redirect, Tabs } from 'expo-router';
import { BookOpen, LayoutDashboard, Settings, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const { role, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/auth/login" />;
  if (role !== 'admin') return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: CREAM },
        tabBarStyle: {
          backgroundColor: EMERALD,
          borderTopWidth: 1,
          borderTopColor: `${GOLD}40`,
          paddingBottom: insets.bottom || 8,
          paddingTop: 8,
          height: 60 + (insets.bottom || 0),
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color }) => <LayoutDashboard size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color }) => <BookOpen size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color }) => <Users size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={20} color={color} />,
        }}
      />
      {/* Hide auto-discovered routes from tab bar */}
      <Tabs.Screen name="activity" options={{ href: null }} />
       <Tabs.Screen name="courses/[id]/lesson-quiz/[lessonId]" options={{ href: null }} />
      <Tabs.Screen name="users-new" options={{ href: null }} />
       <Tabs.Screen name="courses/[id]/lesson/lessonId" options={{ href: null }} />
      <Tabs.Screen name="courses/new" options={{ href: null }} />
      <Tabs.Screen name="courses/[id]/index" options={{ href: null }} />
      <Tabs.Screen name="courses/[id]/edit" options={{ href: null }} />
    </Tabs>
  );
}