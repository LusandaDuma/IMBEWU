/**
 * @fileoverview Guest home — browse published courses; writes require sign-in.
 */

import { Button, CourseCard, SearchBar } from '@/components/shared';
import { APP_BACKGROUND_COLOR } from '@/constants/theme';
import { useCourses } from '@/hooks/useCourse';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { MessageCircle, Search, Sprout } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
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

  const { data: courses = [], isLoading, refetch } = useCourses();

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(q.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <LinearGradient colors={[APP_BACKGROUND_COLOR, APP_BACKGROUND_COLOR]} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Image
              source={require('../../assets/images/name.png')}
              style={{ width: 144, height: 40 }}
              resizeMode="contain"
            />
            <Text className="text-earth-700 text-sm mt-1 font-light">
              Browse courses — sign in when you are ready to learn
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Link href="/nolwazi" asChild>
              <TouchableOpacity
                className="w-11 h-11 rounded-full bg-white/10 items-center justify-center active:bg-white/15"
                accessibilityRole="button"
                accessibilityLabel="Open Nolwazi guide"
              >
                <MessageCircle size={20} color="#1c1917" strokeWidth={1.75} />
              </TouchableOpacity>
            </Link>
            <Link href="/auth/login" asChild>
              <TouchableOpacity className="px-4 py-2 rounded-full bg-primary-600 active:bg-primary-700">
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
            <Text className="text-earth-700 text-xs font-light tracking-wide mb-3 uppercase">
              Published courses
            </Text>
          }
          ListEmptyComponent={
            <View className="py-16 items-center px-6">
              <Sprout size={40} color="#64748b" strokeWidth={1.2} />
              <Text className="text-earth-700 text-center mt-4 font-light">
                {isLoading ? 'Loading catalogue…' : 'No courses match your search.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
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
