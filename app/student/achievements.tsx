/**
 * @fileoverview Student achievements — luxury emerald & gold theme
 * Keeps all badge/certificate download functionality intact.
 */

import { Button, CompletionBadgeTemplate, CompletionCertificateTemplate } from '@/components/shared';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import {
  downloadBadgeTemplate, downloadBadgeTemplates, downloadCertificateTemplate,
  downloadCertificateTemplates, shareBadgeTemplate, shareCertificateTemplate,
} from '@/services/badgeTemplateService';
import { getCompletedCourseCertificates, getStudentAchievementsData, syncAndGetEarnedCourseBadges } from '@/services/supabase';
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

export default function AchievementsScreen() {
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
    queryKey: ['student-achievements', user?.id],
    queryFn: () => (user ? getStudentAchievementsData(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });
  const { data: earnedBadges = [], refetch: refetchBadges } = useQuery({
    queryKey: ['earned-course-badges', user?.id, 'class_based'],
    queryFn: () => (user ? syncAndGetEarnedCourseBadges(user.id, 'class_based') : Promise.resolve([])),
    enabled: !!user,
  });
  const { data: certificates = [], refetch: refetchCerts } = useQuery({
    queryKey: ['completed-course-certificates', user?.id, 'all'],
    queryFn: () => (user ? getCompletedCourseCertificates(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  useRefetchOnFocus(refetch, !!user);
  useRefetchOnFocus(refetchBadges, !!user);
  useRefetchOnFocus(refetchCerts, !!user);

  const achievements = data?.achievements ?? [];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const completionPct = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;
  const stats = [
    { label: 'Hours Learned', value: `${data?.stats.hoursLearned ?? 0}`, icon: Clock },
    { label: 'Courses', value: `${data?.stats.courses ?? 0}`, icon: BookOpen },
    { label: 'Day Streak', value: `${data?.stats.dayStreak ?? 0}`, icon: Flame },
  ];
  const weeklyActivity = data?.weeklyActivity ?? [];
  const maxWeekly = Math.max(1, ...weeklyActivity.map((i) => i.value));
  const learnerName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Imbewu learner';

  const onShareBadge = async () => {
    try {
      setIsSharing(true);
      const b = earnedBadges[0];
      const ref = b ? badgeRefs.current[b.id] : null;
      if (!b || !ref) throw new Error('Badges are still loading. Please try again.');
      await shareBadgeTemplate({ current: ref }, learnerName);
    } catch (e) { Alert.alert('Share failed', e instanceof Error ? e.message : 'Could not share badge.'); }
    finally { setIsSharing(false); }
  };
  const onDownloadBadge = async () => {
    try {
      setIsDownloading(true);
      const b = earnedBadges[0]; const ref = b ? badgeRefs.current[b.id] : null;
      if (!b || !ref) throw new Error('Badges are still loading. Please try again.');
      const uri = await downloadBadgeTemplate({ current: ref }, learnerName, b.course_title);
      Alert.alert('Badge saved', `Saved to:\n${uri}`);
    } catch (e) { Alert.alert('Download failed', e instanceof Error ? e.message : 'Could not save badge.'); }
    finally { setIsDownloading(false); }
  };
  const onDownloadAllBadges = async () => {
    try {
      setIsDownloadingAll(true);
      const downloads = earnedBadges.map((b) => { const n = badgeRefs.current[b.id]; return n ? { ref: { current: n } as RefObject<View | null>, courseTitle: b.course_title } : null; }).filter(Boolean) as { ref: RefObject<View | null>; courseTitle?: string }[];
      if (!downloads.length) throw new Error('Badges loading. Try again.');
      await downloadBadgeTemplates(downloads, learnerName);
      Alert.alert('Badges saved', `Downloaded ${downloads.length} badge(s).`);
    } catch (e) { Alert.alert('Download failed', e instanceof Error ? e.message : 'Could not save badges.'); }
    finally { setIsDownloadingAll(false); }
  };
  const onShareCertificate = async () => {
    try {
      setIsSharingCertificate(true);
      const c = certificates[0]; const ref = c ? certificateRefs.current[c.course_id] : null;
      if (!c || !ref) throw new Error('Certificates loading. Try again.');
      await shareCertificateTemplate({ current: ref }, learnerName);
    } catch (e) { Alert.alert('Share failed', e instanceof Error ? e.message : 'Could not share.'); }
    finally { setIsSharingCertificate(false); }
  };
  const onDownloadCertificate = async () => {
    try {
      setIsDownloadingCertificate(true);
      const c = certificates[0]; const ref = c ? certificateRefs.current[c.course_id] : null;
      if (!c || !ref) throw new Error('Certificates loading. Try again.');
      const uri = await downloadCertificateTemplate({ current: ref }, learnerName, c.course_title);
      Alert.alert('Certificate saved', `Saved to:\n${uri}`);
    } catch (e) { Alert.alert('Download failed', e instanceof Error ? e.message : 'Could not save.'); }
    finally { setIsDownloadingCertificate(false); }
  };
  const onDownloadAllCertificates = async () => {
    try {
      setIsDownloadingAllCertificates(true);
      const downloads = certificates.map((c) => { const n = certificateRefs.current[c.course_id]; return n ? { ref: { current: n } as RefObject<View | null>, courseTitle: c.course_title } : null; }).filter(Boolean) as { ref: RefObject<View | null>; courseTitle?: string }[];
      if (!downloads.length) throw new Error('Certificates loading. Try again.');
      await downloadCertificateTemplates(downloads, learnerName);
      Alert.alert('Certificates saved', `Downloaded ${downloads.length} certificate(s).`);
    } catch (e) { Alert.alert('Download failed', e instanceof Error ? e.message : 'Could not save.'); }
    finally { setIsDownloadingAllCertificates(false); }
  };
  const onDownloadSingleCertificate = async (courseId: string, courseTitle: string) => {
    try {
      setDownloadingCertificateId(courseId);
      const ref = certificateRefs.current[courseId];
      if (!ref) throw new Error('Certificate loading. Try again.');
      const uri = await downloadCertificateTemplate({ current: ref }, learnerName, courseTitle);
      Alert.alert('Certificate saved', `Saved to:\n${uri}`);
    } catch (e) { Alert.alert('Download failed', e instanceof Error ? e.message : 'Could not save.'); }
    finally { setDownloadingCertificateId(null); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
            Recognition
          </Text>
          <Text style={{ color: DARK, fontSize: 28, fontWeight: '300', fontFamily: 'serif' }}>
            Achievements
          </Text>
        </View>

        {/* Hero Banner */}
        <View style={{
          backgroundColor: EMERALD, marginHorizontal: 20, borderRadius: 20,
          padding: 24, marginBottom: 20, borderWidth: 1, borderColor: `${GOLD}40`,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Sparkles size={12} color={GOLD} />
            <Text style={{ color: GOLD, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>
              Your Progress
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={{ color: GOLD, fontSize: 40, fontWeight: '700', fontFamily: 'serif' }}>{unlockedCount}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Achievements unlocked</Text>
            </View>
            <View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: `${GOLD}20`, alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: `${GOLD}60`,
            }}>
              <Trophy size={28} color={GOLD} />
            </View>
          </View>
          <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${completionPct}%`, backgroundColor: GOLD, borderRadius: 2 }} />
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 6 }}>{completionPct}% complete</Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 }}>
          {stats.map((stat) => (
            <View key={stat.label} style={{
              flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16,
              alignItems: 'center', borderWidth: 1, borderColor: '#E8DFD0',
            }}>
              <stat.icon size={18} color={GOLD} />
              <Text style={{ color: DARK, fontSize: 22, fontWeight: '700', fontFamily: 'serif', marginTop: 8 }}>
                {stat.value}
              </Text>
              <Text style={{ color: '#8B7355', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, textAlign: 'center' }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Weekly Activity */}
        {weeklyActivity.length > 0 && (
          <View style={{
            backgroundColor: 'white', marginHorizontal: 20, borderRadius: 16,
            padding: 20, borderWidth: 1, borderColor: '#E8DFD0', marginBottom: 20,
          }}>
            <Text style={{ color: DARK, fontSize: 15, fontWeight: '600', fontFamily: 'serif', marginBottom: 16 }}>
              Weekly Activity
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80 }}>
              {weeklyActivity.map((item, i) => (
                <View key={`${item.day}-${i}`} style={{ alignItems: 'center' }}>
                  <View style={{
                    width: 32, backgroundColor: item.value > 0 ? EMERALD : '#E8DFD0',
                    borderRadius: 6,
                    height: item.value > 0 ? 20 + (item.value / maxWeekly) * 40 : 8,
                    borderWidth: item.value > 0 ? 1 : 0,
                    borderColor: `${GOLD}40`,
                  }} />
                  <Text style={{ color: '#8B7355', fontSize: 10, marginTop: 8 }}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* All Badges */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 12 }}>
            All Badges
          </Text>
          <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#E8DFD0', overflow: 'hidden' }}>
            {achievements.map((achievement, i) => {
              const Icon = achievement.id === 'dedicated-learner' ? Flame : achievement.id === 'course-master' ? Award : Target;
              return (
                <View key={achievement.id} style={{
                  flexDirection: 'row', alignItems: 'center', padding: 16,
                  borderBottomWidth: i < achievements.length - 1 ? 1 : 0,
                  borderBottomColor: '#F0EAE0',
                  opacity: achievement.unlocked ? 1 : 0.5,
                }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: achievement.unlocked ? EMERALD : '#F0EAE0',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: achievement.unlocked ? 2 : 0,
                    borderColor: `${GOLD}60`,
                  }}>
                    {achievement.unlocked ? <Icon size={20} color={GOLD} /> : <Lock size={16} color="#C4B89A" />}
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: DARK, fontWeight: '600', fontSize: 14, marginBottom: 2 }}>{achievement.name}</Text>
                    <Text style={{ color: '#8B7355', fontSize: 12 }}>{achievement.description}</Text>
                  </View>
                  {achievement.unlocked && (
                    <View style={{ backgroundColor: `${GOLD}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: `${GOLD}40` }}>
                      <Text style={{ color: GOLD, fontSize: 10, fontWeight: '700' }}>Unlocked</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Badge Templates */}
        {earnedBadges.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 12 }}>
              Completion Badges
            </Text>
            {earnedBadges.map((badge) => (
              <View key={`visible-${badge.id}`} ref={(n) => { badgeRefs.current[badge.id] = n; }} collapsable={false} style={{ marginBottom: 12 }}>
                <CompletionBadgeTemplate learnerName={learnerName} courseTitle={badge.course_title} awardedAt={badge.awarded_at ?? new Date().toISOString()} />
              </View>
            ))}
            <View style={{ gap: 10, marginTop: 8 }}>
              <Button label={isSharing ? 'Sharing…' : 'Share badge'} onPress={onShareBadge} isLoading={isSharing} disabled={isSharing || isDownloading || isDownloadingAll} fullWidth />
              <Button label={isDownloading ? 'Saving…' : 'Download badge'} onPress={onDownloadBadge} isLoading={isDownloading} disabled={isDownloading || isSharing || isDownloadingAll} variant="secondary" fullWidth />
              <Button label={isDownloadingAll ? 'Saving all…' : 'Download all badges'} onPress={onDownloadAllBadges} isLoading={isDownloadingAll} disabled={isDownloadingAll || isSharing || isDownloading} variant="secondary" fullWidth />
            </View>
          </View>
        )}

        {/* Certificates */}
        {certificates.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
            <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 12 }}>
              Course Certificates
            </Text>
            {certificates.map((cert) => (
              <View key={`cert-${cert.course_id}`} style={{ marginBottom: 16 }}>
                <View ref={(n) => { certificateRefs.current[cert.course_id] = n; }} collapsable={false}>
                  <CompletionCertificateTemplate learnerName={learnerName} courseTitle={cert.course_title} awardedAt={cert.completed_at} />
                </View>
                <View style={{ marginTop: 8 }}>
                  <Button label={downloadingCertificateId === cert.course_id ? 'Saving…' : 'Download this certificate'} onPress={() => void onDownloadSingleCertificate(cert.course_id, cert.course_title)} isLoading={downloadingCertificateId === cert.course_id} disabled={downloadingCertificateId !== null} variant="secondary" fullWidth />
                </View>
              </View>
            ))}
            <View style={{ gap: 10 }}>
              <Button label={isSharingCertificate ? 'Sharing…' : 'Share certificate'} onPress={onShareCertificate} isLoading={isSharingCertificate} disabled={isSharingCertificate || isDownloadingCertificate || isDownloadingAllCertificates} fullWidth />
              <Button label={isDownloadingCertificate ? 'Saving…' : 'Download certificate'} onPress={onDownloadCertificate} isLoading={isDownloadingCertificate} disabled={isDownloadingCertificate || isSharingCertificate || isDownloadingAllCertificates} variant="secondary" fullWidth />
              <Button label={isDownloadingAllCertificates ? 'Saving all…' : 'Download all certificates'} onPress={onDownloadAllCertificates} isLoading={isDownloadingAllCertificates} disabled={isDownloadingAllCertificates || isSharingCertificate || isDownloadingCertificate} variant="secondary" fullWidth />
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
