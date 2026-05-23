/**
 * @fileoverview Guest home — redesigned luxury-themed public catalog home.
 * Keeps existing data fetching and navigation behaviour.
 */

import { Button, SearchBar } from '@/components/shared';
import { COURSE_LOGO_THUMB } from '@/constants/courseBranding';
import { useCourses } from '@/hooks/useCourse';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { MessageCircle, Search, Sprout } from 'lucide-react-native';
import { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BG_COLOR = '#FAF7F2';
const PRIMARY_COLOR = '#1B4332';
const ACCENT_COLOR = '#C9A84C';

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

  return (
    <LinearGradient colors={[BG_COLOR, BG_COLOR]} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.logoText}>IMBEWU</Text>
            <Text style={styles.tagline}>A REFINED AGRICULTURE ACADEMY</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Link href="/nolwazi" asChild>
              <TouchableOpacity
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Open Nolwazi guide"
              >
                <MessageCircle size={20} color={PRIMARY_COLOR} strokeWidth={1.75} />
              </TouchableOpacity>
            </Link>
            <Link href="/auth/login" asChild>
              <TouchableOpacity style={styles.signInBtn}>
                <Text style={styles.signInText}>Sign In</Text>
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
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => refetch()} tintColor={PRIMARY_COLOR} />}
          ListHeaderComponent={
            <View>
              <View style={styles.heroWrap}>
                <Text style={styles.heroTitle}>Grow knowledge.</Text>
                <Text style={styles.heroSubtitle}>Cultivate mastery.</Text>
                <View style={styles.goldUnderline} />
                <Text style={styles.heroSubtext}>
                  Imbewu is an agriculture learning platform built for the modern grower — structured courses, hands-on field work, and an AI copilot trained on indigenous and regenerative practices.
                </Text>

                <View style={{ flexDirection: 'row', marginTop: 16 }}>
                  <Button
                    label="Explore the catalog"
                    variant="primary"
                    size="md"
                    style={{ backgroundColor: PRIMARY_COLOR, marginRight: 12 }}
                    onPress={() => {}}
                  />
                  <Button label="How Imbewu works" variant="outline" size="md" onPress={() => router.push('/nolwazi')} />
                </View>
              </View>

              {featuredCourses.length ? (
                <View style={{ paddingHorizontal: 10, marginTop: 18 }}>
                  <Text style={styles.sectionLabel}>Featured</Text>
                  {featuredCourses.slice(0, 1).map((course) => (
                    <TouchableOpacity
                      key={course.id}
                      activeOpacity={0.92}
                      onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id } })}
                      style={styles.featuredCard}
                    >
                      <View style={styles.featuredTopRow}>
                        <Text style={styles.featuredLabel}>FEATURED COURSE</Text>
                        <Sprout size={18} color={ACCENT_COLOR} strokeWidth={1.4} />
                      </View>
                      <Text style={styles.featuredTitle} numberOfLines={2}>
                        {course.title}
                      </Text>
                      <Text style={styles.featuredDetails}>12 lessons · Field certification · Coordinator-led</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <Text style={styles.allLabel}>All published courses</Text>
            </View>
          }
          ListEmptyComponent={
            <View className="py-16 items-center px-6">
              <Sprout size={40} color="#64748b" strokeWidth={1.2} />
              <Text className="text-earth-700 text-center mt-4 font-light">{isLoading ? 'Loading catalogue…' : 'No courses match your search.'}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.listCard}>
              <View style={{ flexDirection: 'row' }}>
                <View style={styles.thumb}>
                  <Image source={COURSE_LOGO_THUMB} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.courseTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.description ? <Text style={styles.courseDesc} numberOfLines={2}>{item.description}</Text> : null}
                  <View style={{ marginTop: 10 }}>
                    <Button
                      label="View Course"
                      variant="primary"
                      size="md"
                      fullWidth
                      style={{ backgroundColor: PRIMARY_COLOR }}
                      onPress={() => router.push({ pathname: '/course/[id]', params: { id: item.id } })}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG_COLOR,
  },
  logoText: { fontSize: 28, fontWeight: '800', color: PRIMARY_COLOR, fontFamily: 'serif' },
  tagline: { fontSize: 11, color: ACCENT_COLOR, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  signInBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: PRIMARY_COLOR },
  signInText: { color: '#fff', fontWeight: '600' },
  heroWrap: { paddingHorizontal: 10, paddingBottom: 18 },
  heroTitle: { fontSize: 34, fontWeight: '900', color: PRIMARY_COLOR },
  heroSubtitle: { fontSize: 26, fontStyle: 'italic', color: PRIMARY_COLOR, marginTop: 6 },
  goldUnderline: { height: 4, width: 160, backgroundColor: ACCENT_COLOR, marginTop: 6, borderRadius: 2 },
  heroSubtext: { marginTop: 12, color: '#374151', lineHeight: 20 },
  sectionLabel: { marginBottom: 8, color: '#000', fontSize: 12, textTransform: 'uppercase', fontWeight: '700' },
  featuredCard: { backgroundColor: PRIMARY_COLOR, borderRadius: 14, padding: 16, marginTop: 8 },
  featuredTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  featuredLabel: { color: ACCENT_COLOR, fontSize: 12, fontWeight: '700' },
  featuredTitle: { color: '#fff', fontSize: 20, fontWeight: '800', fontFamily: 'serif' },
  featuredDetails: { color: '#fff', fontSize: 12, marginTop: 8 },
  allLabel: { marginTop: 16, color: '#000', fontSize: 12, textTransform: 'uppercase', fontWeight: '700', paddingHorizontal: 10 },
  listCard: { backgroundColor: BG_COLOR, borderColor: '#E6DFD6', borderWidth: 1, padding: 14, borderRadius: 12, marginBottom: 10 },
  thumb: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  courseTitle: { color: PRIMARY_COLOR, fontSize: 16, fontWeight: '700' },
  courseDesc: { color: '#6B7280', marginTop: 6 },
});

export default PublicCatalogHome;
