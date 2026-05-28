/**
 * @fileoverview Student layout — luxury emerald & gold bottom tabs
 */

import { useAuthStore } from '@/store/auth';
import { Redirect, Tabs } from 'expo-router';
import { Award, BookOpen, Compass, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const GOLD = '#C9A84C';

export default function StudentLayout() {
  const insets = useSafeAreaInsets();
  const { role, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Redirect href="/auth/login" />;
  if (role !== 'student') return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#FAF7F2' },
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
      <Tabs.Screen name="index" options={{ title: 'My Courses', tabBarIcon: ({ color }) => <BookOpen size={20} color={color} /> }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ color }) => <Compass size={20} color={color} /> }} />
      <Tabs.Screen name="achievements" options={{ title: 'Achievements', tabBarIcon: ({ color }) => <Award size={20} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <User size={20} color={color} /> }} />
      <Tabs.Screen name="course/[id]" options={{ href: null }} />
            <Tabs.Screen name="course" options={{ href: null }} />
                  <Tabs.Screen name="lesson" options={{ href: null }} />
                  <Tabs.Screen name="my course" options={{ href: null }} />
                  <Tabs.Screen name="[id]" options={{ href: null }} />
                  
    </Tabs>
  );
}
