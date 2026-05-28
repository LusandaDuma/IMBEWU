/**
 * @fileoverview Admin full recent activity feed — luxury emerald & gold theme.
 */

import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { getAdminActivityFeed } from '@/services/adminService';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Activity, ChevronLeft, Clock } from 'lucide-react-native';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const DARK = '#022418';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.replace('/admin')}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: `${EMERALD}10`,
            alignItems: 'center', justifyContent: 'center',
          }}
          activeOpacity={0.85}
        >
          <ChevronLeft size={20} color={DARK} />
        </TouchableOpacity>
        <View>
          <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 }}>
            Console
          </Text>
          <Text style={{ color: DARK, fontSize: 24, fontWeight: '300', fontFamily: 'serif' }}>
            Recent Activity
          </Text>
        </View>
      </View>

      {/* Summary pill */}
      {actions.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: `${EMERALD}08`, borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 10,
            borderWidth: 1, borderColor: `${EMERALD}15`,
          }}>
            <Activity size={14} color={GOLD} />
            <Text style={{ color: '#8B7355', fontSize: 12, fontWeight: '500' }}>
              {actions.length} event{actions.length === 1 ? '' : 's'} recorded
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={actions}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F0EAE0', marginVertical: 2 }} />}
        renderItem={({ item, index }) => (
          <View style={{
            paddingVertical: 16,
            flexDirection: 'row',
            gap: 14,
            alignItems: 'flex-start',
          }}>
            {/* Timeline dot */}
            <View style={{ alignItems: 'center', paddingTop: 4 }}>
              <View style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: index === 0 ? GOLD : `${GOLD}50`,
                borderWidth: index === 0 ? 0 : 1,
                borderColor: `${GOLD}60`,
              }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: DARK, fontSize: 14, fontWeight: '300',
                lineHeight: 20, marginBottom: 6,
              }}>
                {item.text}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Clock size={11} color="#8B7355" />
                <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 0.3 }}>
                  {formatRelativeTime(item.timestamp)}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20, padding: 32,
            alignItems: 'center',
            borderWidth: 1, borderColor: '#E8DFD0',
            marginTop: 8,
          }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: `${GOLD}15`,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Activity size={24} color={GOLD} />
            </View>
            <Text style={{ color: DARK, fontSize: 16, fontWeight: '300', fontFamily: 'serif', marginBottom: 6 }}>
              {isError ? 'Unable to load' : isLoading ? 'Loading activity…' : 'No activity yet'}
            </Text>
            <Text style={{ color: '#8B7355', fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
              {isError
                ? 'Activity data could not be retrieved right now.'
                : isLoading
                ? 'Fetching the latest platform events.'
                : 'Platform events will appear here as they happen.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
