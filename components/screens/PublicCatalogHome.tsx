
/**
 * @fileoverview Guest home — redesigned luxury-themed public catalog home.
 * Keeps existing data fetching and navigation behaviour.
 */

import { Button, SearchBar } from '@/components/shared';
import { useCourses } from '@/hooks/useCourse';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { GraduationCap, Leaf, MessageCircle, Search, Users } from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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

        <FlatList<(typeof filtered)[0]>
          data={[]}
          keyExtractor={(item) => item.id}
          renderItem={null}
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

              {/* Trust / Statistics section: Proudly South African */}
              <View className="mt-6 bg-[#FAF7F2] px-6 py-8 rounded-lg items-center">
                <Text className="text-[#C9A84C] text-xs uppercase font-semibold">PROUDLY SOUTH AFRICAN</Text>
                <Text className="text-[#1B4332] text-2xl font-extrabold text-center mt-3">Agriculture education, available to every grower —</Text>
                <Text className="text-[#1B4332] text-2xl font-extrabold text-center">from Limpopo to the Cape.</Text>

                <Text className="text-[#6B7280] text-center mt-4 px-4">
                  Imbewu is available in all 9 provinces, offered in multiple South African languages including Zulu, Xhosa, Sotho, and Afrikaans. Whether you are a small-scale farmer in the Eastern Cape or a commercial grower in the Western Cape, Imbewu meets you where you are.
                </Text>

                <View className="flex-row justify-between mt-6 w-full px-4">
                  <View className="flex-1 items-center">
                    <Text className="text-[#C9A84C] text-3xl font-extrabold">9</Text>
                    <Text className="text-[#1B4332] text-sm mt-1">Provinces covered</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="text-[#C9A84C] text-3xl font-extrabold">6+</Text>
                    <Text className="text-[#1B4332] text-sm mt-1">Languages supported</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className="text-[#C9A84C] text-3xl font-extrabold">50+</Text>
                    <Text className="text-[#1B4332] text-sm mt-1">Courses available</Text>
                  </View>
                </View>

                <View className="h-[1px] bg-[#C9A84C] w-full my-6" />

                <Text className="text-[#1B4332] italic text-center px-4">&ldquo;The seed of knowledge, planted in every corner of South Africa.&rdquo;</Text>

              </View>

              {/* For Every Role section - dark emerald background, three role cards */}
              <View className="mt-6 px-4 py-6 rounded-xl bg-[#1B4332]">
                <Text className="text-[#C9A84C] text-xs uppercase font-semibold">FOR EVERY ROLE</Text>
                <Text className="text-white text-2xl font-extrabold mt-2">One platform.</Text>
                <Text className="text-[#C9A84C] text-2xl italic font-extrabold">Many hands in the soil.</Text>

                <View className="flex-row mt-5">
                  <View className="flex-1 bg-[#2d5a3d] rounded-lg p-4 mr-2 items-start">
                    <GraduationCap size={24} color="#C9A84C" strokeWidth={1.6} />
                    <Text className="text-white text-lg font-bold mt-3">Students</Text>
                    <Text className="text-white/70 text-sm mt-2">Follow a personal pathway from foundational soil science to advanced agronomy.</Text>
                  </View>

                  <View className="flex-1 bg-[#2d5a3d] rounded-lg p-4 mx-1 items-start">
                    <Users size={24} color="#C9A84C" strokeWidth={1.6} />
                    <Text className="text-white text-lg font-bold mt-3">Coordinators</Text>
                    <Text className="text-white/70 text-sm mt-2">Manage classes, issue certificates, and track learner progress in real time.</Text>
                  </View>

                  <View className="flex-1 bg-[#2d5a3d] rounded-lg p-4 ml-2 items-start">
                    <Leaf size={24} color="#C9A84C" strokeWidth={1.6} />
                    <Text className="text-white text-lg font-bold mt-3">Independent growers</Text>
                    <Text className="text-white/70 text-sm mt-2">Self-paced libraries, the Nolwazi AI copilot, and FieldWise diagnostics.</Text>
                  </View>
                </View>
              </View>
            </View>
          }
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
