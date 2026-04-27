/**
 * @fileoverview Guest home — browse published courses; writes require sign-in.
 */

import { Button, CourseCard, SearchBar } from '@/components/shared';
import { BRAND_ICON, BRAND_NAME } from '@/constants/brandAssets';
import { COURSE_LOGO_THUMB } from '@/constants/courseBranding';
import { APP_BACKGROUND_COLOR } from '@/constants/theme';
import { useCourses } from '@/hooks/useCourse';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Compass, MessageCircle, Search, Sparkles, Sprout } from 'lucide-react-native';
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

  const featuredCourses = filtered.slice(0, 3);

  const categoryPills = [
    { label: 'All', icon: Compass },
    { label: 'Popular', icon: Sparkles },
    { label: 'New', icon: Sprout },
  ];

  return (
    <LinearGradient colors={[APP_BACKGROUND_COLOR, APP_BACKGROUND_COLOR]} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center">
              <Image source={BRAND_ICON} style={{ width: 28, height: 28, marginRight: 8 }} resizeMode="contain" />
              <Image source={BRAND_NAME} style={{ width: 152, height: 42 }} resizeMode="contain" />
            </View>
            <Text className="text-earth-700 text-sm mt-1">
              Discover practical courses, curated like a learning marketplace.
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Link href="/nolwazi" asChild>
              <TouchableOpacity
                className="w-11 h-11 rounded-full bg-earth-300 items-center justify-center active:bg-earth-400"
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
          <SearchBar value={q} onChangeText={setQ} placeholder="Search courses…" icon={Search} variant="light" />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} tintColor="#16a34a" />
          }
          ListHeaderComponent={
            <View>
              <View className="mb-6 pb-4 border-b border-earth-400/35">
                <Text className="text-earth-900 text-xl font-semibold">Course marketplace</Text>
                <Text className="text-earth-600 mt-1 leading-5">
                  Browse featured learning tracks and enrol when ready.
                </Text>
                <View className="flex-row flex-wrap mt-3 gap-x-4 gap-y-1">
                  {categoryPills.map((pill) => {
                    const Icon = pill.icon;
                    return (
                      <View key={pill.label} className="flex-row items-center">
                        <Icon size={14} color="#166534" />
                        <Text className="text-earth-800 text-xs ml-1.5 font-medium">{pill.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {featuredCourses.length ? (
                <View className="mb-4">
                  <Text className="text-black text-xs tracking-wide mb-2 uppercase">Featured now</Text>
                  {featuredCourses.map((course) => (
                    <CourseCard
                      key={`featured-${course.id}`}
                      title={course.title}
                      description={course.description}
                      meta="Featured course"
                      coverImageSource={COURSE_LOGO_THUMB}
                      variant="elevated"
                      onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })}
                      footer={
                        <Button
                          label="View Course"
                          variant="primary"
                          size="sm"
                          fullWidth
                          onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })}
                        />
                      }
                    />
                  ))}
                </View>
              ) : null}

              <Text className="text-black text-xs tracking-wide mb-3 uppercase">All published courses</Text>
            </View>
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
              coverImageSource={COURSE_LOGO_THUMB}
              variant="elevated"
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
