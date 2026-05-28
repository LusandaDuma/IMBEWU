/**
 * @fileoverview Independent learner achievements — luxury emerald & gold theme.
 */

import { Button, CompletionBadgeTemplate, CompletionCertificateTemplate } from '@/components/shared';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import {
  downloadBadgeTemplate,
  downloadBadgeTemplates,
  downloadCertificateTemplate,
  downloadCertificateTemplates,
  shareBadgeTemplate,
  shareCertificateTemplate,
} from '@/services/badgeTemplateService';
import {
  getCompletedCourseCertificates,
  getIndependentAchievementsData,
  syncAndGetEarnedCourseBadges,
} from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Clock, Flame, Lock, Sparkles, Target, Trophy } from 'lucide-react-native';
import { useRef, useState, type RefObject } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const DARK = '#022418';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';

export default function ProgressScreen() {
  const { user, profile } = useAuthStore();
  const badgeRefs = useRef<Record<string, View | null>>({});
  const certificateRefs = useRef<Record<string, View | null>>({});
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isSharingCertificate, setIsSharingCertificate] = useState(false);
  const [isDownloadingCertificate, setIsDownloadingCertificate] = useState(false);
  const [isDownloadingAllCertificates, setIsDownloadingAllCertificates] = useState(false);
  const [downloadingCertificateId, setDownloadingCertificateId] = useState<string | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ['independent-achievements', user?.id],
    queryFn: () => (user ? getIndependentAchievementsData(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });
  const { data: earnedBadges = [], refetch: refetchEarnedBadges } = useQuery({
    queryKey: ['earned-course-badges', user?.id, 'independent'],
    queryFn: () => (user ? syncAndGetEarnedCourseBadges(user.id, 'independent') : Promise.resolve([])),
    enabled: !!user,
  });
  const { data: certificates = [], refetch: refetchCertificates } = useQuery({
    queryKey: ['completed-course-certificates', user?.id, 'all'],
    queryFn: () => (user ? getCompletedCourseCertificates(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  useRefetchOnFocus(refetch, !!user);
  useRefetchOnFocus(refetchEarnedBadges, !!user);
  useRefetchOnFocus(refetchCertificates, !!user);

  const stats = [
    { label: 'Hours Learned', value: `${data?.stats.hoursLearned ?? 0}`, icon: Clock },
    { label: 'Courses', value: `${data?.stats.courses ?? 0}`, icon: BookOpen },
    { label: 'Day Streak', value: `${data?.stats.dayStreak ?? 0}`, icon: Flame },
  ];

  const weeklyActivity = data?.weeklyActivity ?? [];
  const maxWeeklyValue = Math.max(1, ...weeklyActivity.map((item) => item.value));
  const achievements = data?.achievements ?? [];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const hasCourseCompletionBadge = earnedBadges.length > 0;
  const hasCertificates = certificates.length > 0;
  const learnerName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Imbewu learner';

  const onShareBadge = async () => {
    try {
      setIsSharing(true);
      const firstBadge = earnedBadges[0];
      const firstBadgeRef = firstBadge ? badgeRefs.current[firstBadge.id] : null;
      if (!firstBadge || !firstBadgeRef) throw new Error('Badges are still loading. Please try again in a moment.');
      await shareBadgeTemplate({ current: firstBadgeRef }, learnerName);
    } catch (error) {
      Alert.alert('Share failed', error instanceof Error ? error.message : 'Could not share badge right now.');
    } finally { setIsSharing(false); }
  };

  const onDownloadBadge = async () => {
    try {
      setIsDownloading(true);
      const firstBadge = earnedBadges[0];
      const firstBadgeRef = firstBadge ? badgeRefs.current[firstBadge.id] : null;
      if (!firstBadge || !firstBadgeRef) throw new Error('Badges are still loading. Please try again in a moment.');
      const uri = await downloadBadgeTemplate({ current: firstBadgeRef }, learnerName, firstBadge.course_title);
      Alert.alert('Badge saved', `Saved to:\n${uri}`);
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Could not save badge right now.');
    } finally { setIsDownloading(false); }
  };

  const onDownloadAllBadges = async () => {
    try {
      setIsDownloadingAll(true);
      const badgeDownloads: Array<{ ref: RefObject<View | null>; courseTitle?: string }> = [];
      for (const badge of earnedBadges) {
        const node = badgeRefs.current[badge.id];
        if (!node) continue;
        badgeDownloads.push({ ref: { current: node } as RefObject<View | null>, courseTitle: badge.course_title });
      }
      if (badgeDownloads.length === 0) throw new Error('Badges are still loading. Please try again in a moment.');
      await downloadBadgeTemplates(badgeDownloads, learnerName);
      Alert.alert('Badges saved', `Downloaded ${badgeDownloads.length} badge${badgeDownloads.length === 1 ? '' : 's'}.`);
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Could not save all badges right now.');
    } finally { setIsDownloadingAll(false); }
  };

  const onShareCertificate = async () => {
    try {
      setIsSharingCertificate(true);
      const firstCert = certificates[0];
      const firstCertRef = firstCert ? certificateRefs.current[firstCert.course_id] : null;
      if (!firstCert || !firstCertRef) throw new Error('Certificates are still loading. Please try again in a moment.');
      await shareCertificateTemplate({ current: firstCertRef }, learnerName);
    } catch (error) {
      Alert.alert('Share failed', error instanceof Error ? error.message : 'Could not share certificate right now.');
    } finally { setIsSharingCertificate(false); }
  };

  const onDownloadCertificate = async () => {
    try {
      setIsDownloadingCertificate(true);
      const firstCert = certificates[0];
      const firstCertRef = firstCert ? certificateRefs.current[firstCert.course_id] : null;
      if (!firstCert || !firstCertRef) throw new Error('Certificates are still loading. Please try again in a moment.');
      const uri = await downloadCertificateTemplate({ current: firstCertRef }, learnerName, firstCert.course_title);
      Alert.alert('Certificate saved', `Saved to:\n${uri}`);
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Could not save certificate right now.');
    } finally { setIsDownloadingCertificate(false); }
  };

  const onDownloadAllCertificates = async () => {
    try {
      setIsDownloadingAllCertificates(true);
      const certificateDownloads: Array<{ ref: RefObject<View | null>; courseTitle: string }> = [];
      for (const certificate of certificates) {
        const node = certificateRefs.current[certificate.course_id];
        if (!node) continue;
        certificateDownloads.push({ ref: { current: node } as RefObject<View | null>, courseTitle: certificate.course_title });
      }
      if (certificateDownloads.length === 0) throw new Error('Certificates are still loading. Please try again in a moment.');
      await downloadCertificateTemplates(certificateDownloads, learnerName);
      Alert.alert('Certificates saved', `Downloaded ${certificateDownloads.length} certificate${certificateDownloads.length === 1 ? '' : 's'}.`);
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Could not save all certificates right now.');
    } finally { setIsDownloadingAllCertificates(false); }
  };

  const onDownloadSingleCertificate = async (courseId: string, courseTitle: string) => {
    try {
      setDownloadingCertificateId(courseId);
      const certificateRef = certificateRefs.current[courseId];
      if (!certificateRef) throw new Error('Certificate is still loading. Please try again in a moment.');
      const uri = await downloadCertificateTemplate({ current: certificateRef }, learnerName, courseTitle);
      Alert.alert('Certificate saved', `Saved to:\n${uri}`);
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Could not save certificate right now.');
    } finally { setDownloadingCertificateId(null); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
            Progress
          </Text>
          <Text style={{ color: DARK, fontSize: 28, fontWeight: '300', fontFamily: 'serif' }}>
            Achievements
          </Text>
        </View>

        {/* Stats strip */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 }}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} style={{
                flex: 1, backgroundColor: 'white',
                borderRadius: 16, padding: 14, alignItems: 'center',
                borderWidth: 1, borderColor: '#E8DFD0',
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: `${GOLD}15`,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                }}>
                  <Icon size={18} color={GOLD} />
                </View>
                <Text style={{ color: DARK, fontSize: 22, fontWeight: '300', fontFamily: 'serif' }}>{stat.value}</Text>
                <Text style={{ color: '#8B7355', fontSize: 10, letterSpacing: 0.5, textAlign: 'center', marginTop: 2 }}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Weekly Activity */}
        <View style={{
          backgroundColor: EMERALD, marginHorizontal: 20, borderRadius: 20,
          padding: 20, marginBottom: 16,
          borderWidth: 1, borderColor: `${GOLD}20`,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Sparkles size={14} color={GOLD} />
            <Text style={{ color: '#f5f0e8', fontSize: 13, fontWeight: '300', letterSpacing: 0.5 }}>
              Weekly Activity
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 64 }}>
            {weeklyActivity.map((item, index) => (
              <View key={`${item.day}-${index}`} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 28,
                  height: item.value > 0 ? 20 + (item.value / maxWeeklyValue) * 40 : 6,
                  backgroundColor: item.value > 0 ? GOLD : `${GOLD}25`,
                  borderRadius: 6,
                  opacity: item.value > 0 ? 1 : 0.5,
                }} />
                <Text style={{ color: `${GOLD}80`, fontSize: 10, marginTop: 6, letterSpacing: 0.5 }}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements */}
        <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
          <View style={{
            backgroundColor: 'white', borderRadius: 20,
            padding: 20, borderWidth: 1, borderColor: '#E8DFD0',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Trophy size={16} color={GOLD} />
                <Text style={{ color: DARK, fontSize: 16, fontWeight: '600', fontFamily: 'serif' }}>Achievements</Text>
              </View>
              {achievements.length > 0 && (
                <View style={{
                  backgroundColor: `${EMERALD}10`, borderRadius: 10,
                  paddingHorizontal: 10, paddingVertical: 4,
                }}>
                  <Text style={{ color: EMERALD, fontSize: 11, fontWeight: '600' }}>
                    {unlockedCount}/{achievements.length}
                  </Text>
                </View>
              )}
            </View>

            {achievements.length === 0 ? (
              <Text style={{ color: '#8B7355', fontSize: 13, fontWeight: '300', textAlign: 'center', paddingVertical: 12 }}>
                Complete lessons to unlock achievements.
              </Text>
            ) : achievements.map((achievement) => {
              const Icon = achievement.id === 'dedicated-learner' ? Flame : achievement.id === 'course-master' ? Award : Target;
              return (
                <View key={achievement.id} style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: '#F0EAE0',
                  opacity: achievement.unlocked ? 1 : 0.45,
                }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: achievement.unlocked ? `${GOLD}15` : '#F0EAE0',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {achievement.unlocked
                      ? <Icon size={20} color={GOLD} />
                      : <Lock size={16} color="#C4B89A" />
                    }
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: DARK, fontSize: 14, fontWeight: '500', marginBottom: 2 }}>{achievement.name}</Text>
                    <Text style={{ color: '#8B7355', fontSize: 12, fontWeight: '300' }}>{achievement.description}</Text>
                  </View>
                  {achievement.unlocked && (
                    <View style={{
                      backgroundColor: `${EMERALD}12`, borderRadius: 10,
                      paddingHorizontal: 9, paddingVertical: 4,
                    }}>
                      <Text style={{ color: EMERALD, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>Unlocked</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Completion Badges */}
        {hasCourseCompletionBadge && (
          <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
            <View style={{
              backgroundColor: 'white', borderRadius: 20,
              padding: 20, borderWidth: 1, borderColor: '#E8DFD0',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Award size={16} color={GOLD} />
                <Text style={{ color: DARK, fontSize: 16, fontWeight: '600', fontFamily: 'serif' }}>Completion Badges</Text>
              </View>

              {earnedBadges.map((badge) => (
                <View key={badge.id} style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0EAE0',
                }}>
                  <Text style={{ color: DARK, fontSize: 13, fontWeight: '500' }}>{badge.badge_name}</Text>
                  <Text style={{ color: '#8B7355', fontSize: 12 }}>{badge.course_title}</Text>
                </View>
              ))}

              {earnedBadges.map((badge) => (
                <View
                  key={`visible-${badge.id}`}
                  ref={(node) => { badgeRefs.current[badge.id] = node; }}
                  collapsable={false}
                  style={{ marginTop: 12 }}
                >
                  <CompletionBadgeTemplate
                    learnerName={learnerName}
                    courseTitle={badge.course_title}
                    awardedAt={badge.awarded_at ?? new Date().toISOString()}
                  />
                </View>
              ))}

              <View style={{ marginTop: 16, gap: 8 }}>
                <Button label={isSharing ? 'Sharing…' : 'Share badge'} onPress={onShareBadge} isLoading={isSharing} disabled={isSharing || isDownloading || isDownloadingAll} fullWidth />
                <Button label={isDownloading ? 'Saving…' : 'Download badge'} onPress={onDownloadBadge} isLoading={isDownloading} disabled={isDownloading || isSharing || isDownloadingAll} variant="secondary" fullWidth />
                <Button label={isDownloadingAll ? 'Saving all…' : 'Download all badges'} onPress={onDownloadAllBadges} isLoading={isDownloadingAll} disabled={isDownloadingAll || isSharing || isDownloading} variant="secondary" fullWidth />
              </View>
            </View>
          </View>
        )}

        {/* Certificates */}
        {hasCertificates && (
          <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
            <View style={{
              backgroundColor: 'white', borderRadius: 20,
              padding: 20, borderWidth: 1, borderColor: '#E8DFD0',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Sparkles size={16} color={GOLD} />
                <Text style={{ color: DARK, fontSize: 16, fontWeight: '600', fontFamily: 'serif' }}>Course Certificates</Text>
              </View>

              {certificates.map((certificate) => (
                <View key={`certificate-visible-${certificate.course_id}`} style={{ marginBottom: 16 }}>
                  <View style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingVertical: 10, marginBottom: 8,
                    borderBottomWidth: 1, borderBottomColor: '#F0EAE0',
                  }}>
                    <Text style={{ color: DARK, fontSize: 13, fontWeight: '500' }}>Certificate</Text>
                    <Text style={{ color: '#8B7355', fontSize: 12 }}>{certificate.course_title}</Text>
                  </View>
                  <View
                    ref={(node) => { certificateRefs.current[certificate.course_id] = node; }}
                    collapsable={false}
                  >
                    <CompletionCertificateTemplate
                      learnerName={learnerName}
                      courseTitle={certificate.course_title}
                      awardedAt={certificate.completed_at}
                    />
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <Button
                      label={downloadingCertificateId === certificate.course_id ? 'Saving…' : 'Download this certificate'}
                      onPress={() => { void onDownloadSingleCertificate(certificate.course_id, certificate.course_title); }}
                      isLoading={downloadingCertificateId === certificate.course_id}
                      disabled={downloadingCertificateId !== null}
                      variant="secondary"
                      fullWidth
                    />
                  </View>
                </View>
              ))}

              <View style={{ gap: 8, marginTop: 4 }}>
                <Button label={isSharingCertificate ? 'Sharing…' : 'Share certificate'} onPress={onShareCertificate} isLoading={isSharingCertificate} disabled={isSharingCertificate || isDownloadingCertificate || isDownloadingAllCertificates} fullWidth />
                <Button label={isDownloadingCertificate ? 'Saving…' : 'Download certificate'} onPress={onDownloadCertificate} isLoading={isDownloadingCertificate} disabled={isDownloadingCertificate || isSharingCertificate || isDownloadingAllCertificates} variant="secondary" fullWidth />
                <Button label={isDownloadingAllCertificates ? 'Saving all…' : 'Download all certificates'} onPress={onDownloadAllCertificates} isLoading={isDownloadingAllCertificates} disabled={isDownloadingAllCertificates || isSharingCertificate || isDownloadingCertificate} variant="secondary" fullWidth />
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
