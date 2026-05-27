/**
 * @fileoverview Coordinator certificates — full luxury visual treatment.
 */

import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { getCoordinatorCertificateRecipients } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, BookOpen, GraduationCap } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatCompletedDate(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');
}

// Cycles through a small palette so each card feels distinct
const AVATAR_COLORS = ['#16a34a', '#0891b2', '#d97706', '#7c3aed', '#dc2626', '#0d9488'];

export default function CoordinatorCertificatesScreen() {
  const { user } = useAuthStore();

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['coordinator-certificate-recipients', user?.id],
    queryFn: () => (user?.id ? getCoordinatorCertificateRecipients(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
  });

  useRefetchOnFocus(refetch, !!user?.id);

  // Unique courses count for the summary card
  const uniqueCourses = useMemo(
    () => new Set(data.map((d) => d.course_title)).size,
    [data]
  );

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
        >

          {/* ── Hero card ─────────────────────────────────────────────── */}
          <View style={{ margin: 16, borderRadius: 28, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#0a2416', '#0d3020', '#071a0f']}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={{ padding: 24, paddingBottom: 28 }}
            >
              {/* Watermark */}
              <Text style={{
                position: 'absolute', right: 10, top: 6,
                fontSize: 80, fontWeight: '800',
                color: 'rgba(212,175,55,0.05)', letterSpacing: -4,
              }}>
                C
              </Text>

              {/* Badge */}
              <View style={{
                borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)',
                borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
                alignSelf: 'flex-start', marginBottom: 16,
              }}>
                <Text style={{ color: '#d4af37', fontSize: 9, letterSpacing: 2.5, fontWeight: '400' }}>
                  COURSE CERTIFICATES
                </Text>
              </View>

              {/* Headline */}
              <Text style={{
                color: '#f5f0e8', fontSize: 26, fontWeight: '200',
                letterSpacing: -0.5, lineHeight: 30, marginBottom: 8,
              }}>
                Student{'\n'}Achievements
              </Text>
              <Text style={{
                color: 'rgba(245,240,232,0.4)', fontSize: 12,
                fontWeight: '300', lineHeight: 18, marginBottom: 22,
              }}>
                Learners who completed a full course in your programme.
              </Text>

              {/* Summary tiles */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{
                  flex: 1, backgroundColor: 'rgba(212,175,55,0.1)',
                  borderRadius: 14, padding: 14,
                }}>
                  <Text style={{ color: '#d4af37', fontSize: 28, fontWeight: '200', letterSpacing: -1 }}>
                    {data.length}
                  </Text>
                  <Text style={{ color: 'rgba(212,175,55,0.6)', fontSize: 9, letterSpacing: 2, fontWeight: '400', marginTop: 2 }}>
                    CERTIFICATES
                  </Text>
                </View>
                <View style={{
                  flex: 1, backgroundColor: 'rgba(22,163,74,0.12)',
                  borderRadius: 14, padding: 14,
                }}>
                  <Text style={{ color: '#4ade80', fontSize: 28, fontWeight: '200', letterSpacing: -1 }}>
                    {uniqueCourses}
                  </Text>
                  <Text style={{ color: 'rgba(74,222,128,0.6)', fontSize: 9, letterSpacing: 2, fontWeight: '400', marginTop: 2 }}>
                    COURSES
                  </Text>
                </View>
              </View>

              {/* Gold rule */}
              <View style={{
                marginTop: 20, height: 1,
                backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 1,
              }} />
            </LinearGradient>
          </View>

          {/* ── Certificate list ──────────────────────────────────────── */}
          <View style={{ paddingHorizontal: 16 }}>
            {isLoading ? (
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 24,
                padding: 32, alignItems: 'center',
              }}>
                <Text style={{ color: '#a8a29e', fontSize: 13, fontWeight: '300' }}>
                  Loading certificates…
                </Text>
              </View>

            ) : data.length === 0 ? (
              /* ── Empty state ──────────────────────────────────────── */
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 24,
                padding: 36, alignItems: 'center',
              }}>
                <View style={{
                  width: 56, height: 56, borderRadius: 28,
                  backgroundColor: 'rgba(22,163,74,0.08)',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                }}>
                  <GraduationCap size={26} color="#a8a29e" strokeWidth={1.5} />
                </View>
                <Text style={{ color: '#57534e', fontSize: 15, fontWeight: '300', marginBottom: 6 }}>
                  No certificates yet
                </Text>
                <Text style={{
                  color: '#a8a29e', fontSize: 12, fontWeight: '300',
                  textAlign: 'center', lineHeight: 18,
                }}>
                  Certificates appear here once students complete a full course in your programme.
                </Text>
              </View>

            ) : (
              /* ── Certificate cards ────────────────────────────────── */
              <View style={{ gap: 10 }}>
                {data.map((item, index) => {
                  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
                  const initials = getInitials(item.student_name);
                  return (
                    <View
                      key={item.id}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.65)',
                        borderRadius: 20,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      {/* Avatar */}
                      <View style={{
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: `${avatarColor}18`,
                        alignItems: 'center', justifyContent: 'center',
                        marginRight: 14, flexShrink: 0,
                      }}>
                        <Text style={{ color: avatarColor, fontSize: 14, fontWeight: '500' }}>
                          {initials}
                        </Text>
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#1c1917', fontSize: 14, fontWeight: '400', marginBottom: 2 }}>
                          {item.student_name}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <BookOpen size={11} color="#a8a29e" strokeWidth={1.5} />
                          <Text style={{
                            color: '#78716c', fontSize: 11,
                            fontWeight: '300', marginLeft: 4,
                          }} numberOfLines={1}>
                            {item.course_title}
                          </Text>
                        </View>

                        <Text style={{ color: '#a8a29e', fontSize: 10, fontWeight: '300' }}>
                          Completed {formatCompletedDate(item.completed_at)}
                        </Text>
                      </View>

                      {/* Badge */}
                      <View style={{
                        width: 34, height: 34, borderRadius: 17,
                        backgroundColor: 'rgba(22,163,74,0.1)',
                        alignItems: 'center', justifyContent: 'center',
                        marginLeft: 10, flexShrink: 0,
                      }}>
                        <Award size={16} color="#16a34a" strokeWidth={1.5} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
