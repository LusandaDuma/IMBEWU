/**
 * @fileoverview Guest home — browse published courses; writes require sign-in.
 */

import { Button, CourseCard, SearchBar } from '@/components/shared';
import { getCourses } from '@/services/supabase';
import type { Course } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { MessageCircle, Search, Sprout } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function promptSignIn(router: ReturnType<typeof useRouter>) {
  Alert.alert(
    'Sign in to enrol',
    'You can browse every course here. To enrol and save progress, sign in or create an account.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Sign in', onPress: () => router.push('/auth/login') },
    ]
  );
}

export function PublicCatalogHome() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const { data: courses = [], isLoading, refetch } = useQuery({
    queryKey: ['public-catalog-courses'],
    queryFn: getCourses,
    staleTime: 60_000,
  });

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(q.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-light text-white tracking-tight">Imbewu</Text>
            <Text className="text-slate-400 text-sm mt-1 font-light">
              Browse courses — sign in when you are ready to learn
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Link href="/nolwazi" asChild>
              <TouchableOpacity
                className="w-11 h-11 rounded-full bg-white/10 items-center justify-center active:bg-white/15"
                accessibilityRole="button"
                accessibilityLabel="Open Nolwazi — AgroLearn guide"
              >
                <MessageCircle size={20} color="#e2e8f0" strokeWidth={1.75} />
              </TouchableOpacity>
            </Link>
            <Link href="/auth/login" asChild>
              <TouchableOpacity className="px-4 py-2 rounded-full bg-white/10 active:bg-white/15">
                <Text className="text-white text-sm font-medium tracking-wide">Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View className="px-5 mb-3">
          <SearchBar value={q} onChangeText={setQ} placeholder="Search courses…" icon={Search} variant="dark" />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} tintColor="#86efac" />
          }
          ListHeaderComponent={
            <Text className="text-slate-500 text-xs font-light tracking-wide mb-3 uppercase">
              Published courses
            </Text>
          }
          ListEmptyComponent={
            <View className="py-16 items-center px-6">
              <Sprout size={40} color="#64748b" strokeWidth={1.2} />
              <Text className="text-slate-400 text-center mt-4 font-light">
                {isLoading ? 'Loading catalogue…' : 'No courses match your search.'}
              </Text>
            </View>
          }
          renderItem={({ item }: { item: Course }) => (
            <CourseCard
              title={item.title}
              description={item.description}
              placeholderIcon={Sprout}
              variant="dark"
              onPress={() => router.push({ pathname: '/course/[id]', params: { id: item.id } })}
              footer={
                <Button
                  label="Enrol"
                  variant="primary"
                  size="md"
                  fullWidth
                  onPress={() => promptSignIn(router)}
                />
              }
            />
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
