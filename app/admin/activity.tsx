/**
 * @fileoverview Admin full recent activity feed.
 */

import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { getAdminActivityFeed } from '@/services/adminService';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatRelativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';

  const diffMs = timestamp - Date.now();
  const absMs = Math.abs(diffMs);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absMs < hour) return formatter.format(Math.round(diffMs / minute), 'minute');
  if (absMs < day) return formatter.format(Math.round(diffMs / hour), 'hour');
  return formatter.format(Math.round(diffMs / day), 'day');
}

export default function AdminActivityScreen() {
  const router = useRouter();
  const { data: actions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-activity-feed'],
    queryFn: getAdminActivityFeed,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useRefetchOnFocus(refetch, true);

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pb-4 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.replace('/admin')}
            className="w-10 h-10 rounded-full bg-earth-900/5 items-center justify-center"
            activeOpacity={0.9}
          >
            <ChevronLeft size={20} color="#1c1917" />
          </TouchableOpacity>
          <View className="ml-3">
            <Text className="text-2xl font-bold text-black">Recent activity</Text>
            <Text className="text-earth-800">Full admin activity timeline</Text>
          </View>
        </View>

        <FlatList
          data={actions}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View className="py-3 mb-1 border-b border-earth-400/40">
              <Text className="text-earth-800 text-sm leading-5 font-light">{item.text}</Text>
              <Text className="text-earth-500 text-xs mt-2 font-light tracking-wide">
                {formatRelativeTime(item.timestamp)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View className="px-4 py-3.5 rounded-2xl">
              <Text className="text-earth-600 text-sm leading-5 font-light">
                {isError ? 'Unable to load activity right now.' : isLoading ? 'Loading activity...' : 'No activity yet.'}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
