/**
 * @fileoverview Student achievements screen
 */

import { Button, CompletionBadgeTemplate } from '@/components/shared';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
<<<<<<< HEAD
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
  getStudentAchievementsData,
  syncAndGetEarnedCourseBadges,
=======
import { downloadBadgeTemplate, shareBadgeTemplate } from '@/services/badgeTemplateService';
import {
    checkAndAwardCourseBadges,
    getCourseProgressSummary,
    getEarnedCourseBadges,
    getEnrolmentsByUser,
    getStudentAchievementsData,
>>>>>>> e9a83bbf57b37dac69895bd87a03ad605517ac0a
} from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, BookOpen, Clock, Flame, Target } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
<<<<<<< HEAD
import { Button, CompletionBadgeTemplate, CompletionCertificateTemplate } from '@/components/shared';
=======
>>>>>>> e9a83bbf57b37dac69895bd87a03ad605517ac0a

export default function AchievementsScreen() {
  const { user, profile } = useAuthStore();
  const badgeRefs = useRef<Record<string, View | null>>({});
<<<<<<< HEAD
  const certificateRefs = useRef<Record<string, View | null>>({});
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isSharingCertificate, setIsSharingCertificate] = useState(false);
  const [isDownloadingCertificate, setIsDownloadingCertificate] = useState(false);
  const [isDownloadingAllCertificates, setIsDownloadingAllCertificates] = useState(false);
=======
  const [sharingBadgeId, setSharingBadgeId] = useState<string | null>(null);
  const [downloadingBadgeId, setDownloadingBadgeId] = useState<string | null>(null);
>>>>>>> e9a83bbf57b37dac69895bd87a03ad605517ac0a
  const { data, refetch } = useQuery({
    queryKey: ['student-achievements', user?.id],
    queryFn: () => (user ? getStudentAchievementsData(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });
  const { data: earnedBadges = [], refetch: refetchEarnedBadges } = useQuery({
<<<<<<< HEAD
    queryKey: ['earned-course-badges', user?.id, 'class_based'],
    queryFn: () => (user ? syncAndGetEarnedCourseBadges(user.id, 'class_based') : Promise.resolve([])),
=======
    queryKey: ['earned-course-badges', user?.id],
    queryFn: () => (user ? getEarnedCourseBadges(user.id) : Promise.resolve([])),
    enabled: !!user,
  });
  const { data: completedCourses = [] } = useQuery({
    queryKey: ['completed-courses', 'student', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const enrolments = await getEnrolmentsByUser(user.id);
      const summaries = await Promise.all(
        enrolments.map(async (enrolment) => {
          const summary = await getCourseProgressSummary(user.id, enrolment.course_id);
          return { courseId: enrolment.course_id, title: enrolment.courses?.title ?? 'Course', summary };
        })
      );

      return summaries
        .filter((item) => item.summary.totalLessons > 0 && item.summary.completedLessons === item.summary.totalLessons)
        .map((item) => ({ courseId: item.courseId, courseTitle: item.title }));
    },
>>>>>>> e9a83bbf57b37dac69895bd87a03ad605517ac0a
    enabled: !!user,
  });
  const { data: certificates = [], refetch: refetchCertificates } = useQuery({
    queryKey: ['completed-course-certificates', user?.id, 'class_based'],
    queryFn: () => (user ? getCompletedCourseCertificates(user.id, 'class_based') : Promise.resolve([])),
    enabled: !!user,
  });

  useRefetchOnFocus(refetch, !!user);
  useRefetchOnFocus(refetchEarnedBadges, !!user);
<<<<<<< HEAD
  useRefetchOnFocus(refetchCertificates, !!user);
=======
  useEffect(() => {
    if (!user || completedCourses.length === 0) return;
    let active = true;

    const ensureAwarded = async () => {
      await Promise.all(completedCourses.map((course) => checkAndAwardCourseBadges(user.id, course.courseId)));
      if (active) {
        void refetchEarnedBadges();
      }
    };

    void ensureAwarded();
    return () => {
      active = false;
    };
  }, [user, completedCourses, refetchEarnedBadges]);
>>>>>>> e9a83bbf57b37dac69895bd87a03ad605517ac0a

  const achievements = data?.achievements ?? [];
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;
  const completionPct = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;
  const stats = [
    { label: 'Hours Learned', value: `${data?.stats.hoursLearned ?? 0}`, icon: Clock, color: '#0891b2' },
    { label: 'Courses', value: `${data?.stats.courses ?? 0}`, icon: BookOpen, color: '#16a34a' },
    { label: 'Day Streak', value: `${data?.stats.dayStreak ?? 0}`, icon: Flame, color: '#ea580c' },
  ];
  const weeklyActivity = data?.weeklyActivity ?? [];
  const maxWeeklyValue = Math.max(1, ...weeklyActivity.map((item) => item.value));
  const fallbackBadges = useMemo(
    () =>
      completedCourses.map((course) => ({
        id: `fallback-${course.courseId}`,
        course_id: course.courseId,
        badge_name: 'Course Completion',
        course_title: course.courseTitle,
        awarded_at: new Date().toISOString(),
      })),
    [completedCourses]
  );
  const effectiveBadges = useMemo(() => {
    const earnedCourseIds = new Set(earnedBadges.map((badge) => badge.course_id));
    const missingFallbackBadges = fallbackBadges.filter((badge) => !earnedCourseIds.has(badge.course_id));
    return [...earnedBadges, ...missingFallbackBadges];
  }, [earnedBadges, fallbackBadges]);
  const hasCourseCompletionBadge = effectiveBadges.length > 0;
  const hasCertificates = certificates.length > 0;
  const learnerName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Imbewu learner';

  const onShareBadge = async (badgeId: string) => {
    const badgeNode = badgeRefs.current[badgeId];
    if (!badgeNode) {
      Alert.alert('Share failed', 'Badge preview is not ready yet. Please try again.');
      return;
    }

    try {
      setSharingBadgeId(badgeId);
      await shareBadgeTemplate({ current: badgeNode }, learnerName);
    } catch (error) {
      Alert.alert('Share failed', error instanceof Error ? error.message : 'Could not share badge right now.');
    } finally {
      setSharingBadgeId(null);
    }
  };

  const onDownloadBadge = async (badgeId: string) => {
    const badgeNode = badgeRefs.current[badgeId];
    if (!badgeNode) {
      Alert.alert('Download failed', 'Badge preview is not ready yet. Please try again.');
      return;
    }

    try {
      setDownloadingBadgeId(badgeId);
      const uri = await downloadBadgeTemplate({ current: badgeNode }, learnerName);
      Alert.alert('Badge saved', `Saved to:\n${uri}`);
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Could not save badge right now.');
    } finally {
      setDownloadingBadgeId(null);
    }
  };

  const onShareCertificate = async () => {
    try {
      setIsSharingCertificate(true);
      const firstCertificate = certificates[0];
      const firstCertificateRef = firstCertificate ? certificateRefs.current[firstCertificate.course_id] : null;
      if (!firstCertificate || !firstCertificateRef) {
        throw new Error('Certificates are still loading. Please try again in a moment.');
      }
      await shareCertificateTemplate({ current: firstCertificateRef }, learnerName);
    } catch (error) {
      Alert.alert('Share failed', error instanceof Error ? error.message : 'Could not share certificate right now.');
    } finally {
      setIsSharingCertificate(false);
    }
  };

  const onDownloadCertificate = async () => {
    try {
      setIsDownloadingCertificate(true);
      const firstCertificate = certificates[0];
      const firstCertificateRef = firstCertificate ? certificateRefs.current[firstCertificate.course_id] : null;
      if (!firstCertificate || !firstCertificateRef) {
        throw new Error('Certificates are still loading. Please try again in a moment.');
      }
      const uri = await downloadCertificateTemplate(
        { current: firstCertificateRef },
        learnerName,
        firstCertificate.course_title
      );
      Alert.alert('Certificate saved', `Saved to:\n${uri}`);
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Could not save certificate right now.');
    } finally {
      setIsDownloadingCertificate(false);
    }
  };

  const onDownloadAllCertificates = async () => {
    try {
      setIsDownloadingAllCertificates(true);
      const certificateDownloads = certificates
        .map((certificate) => {
          const ref = certificateRefs.current[certificate.course_id];
          return ref ? { ref: { current: ref }, courseTitle: certificate.course_title } : null;
        })
        .filter((item): item is { ref: RefObject<View | null>; courseTitle?: string } => item !== null);

      if (certificateDownloads.length === 0) {
        throw new Error('Certificates are still loading. Please try again in a moment.');
      }

      await downloadCertificateTemplates(certificateDownloads, learnerName);
      Alert.alert(
        'Certificates saved',
        `Downloaded ${certificateDownloads.length} certificate${certificateDownloads.length === 1 ? '' : 's'}.`
      );
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Could not save all certificates right now.');
    } finally {
      setIsDownloadingAllCertificates(false);
    }
  };

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-earth-900">Achievements</Text>
        <Text className="text-earth-600 mt-1">Your progress</Text>
      </View>

      <ScrollView className="flex-1 px-5">
        <View className="flex-row justify-between mb-6 border-b border-earth-400/35 pb-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} className="flex-1 mx-1">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon size={20} color={stat.color} />
                </View>
                <Text className="text-2xl font-bold text-earth-800">{stat.value}</Text>
                <Text className="text-earth-500 text-xs">{stat.label}</Text>
              </View>
            );
          })}
        </View>

        <View className="mb-6 pb-5 border-b border-earth-400/35">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-primary-600">{unlockedCount}</Text>
              <Text className="text-earth-500">Achievements unlocked</Text>
            </View>
            <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center">
              <Award size={32} color="#16a34a" />
            </View>
          </View>
          <View className="h-2 bg-earth-100 rounded-full mt-4 overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${completionPct}%` }}
            />
          </View>
          <Text className="text-earth-500 text-sm mt-2">{completionPct}% complete</Text>
        </View>

        <View className="mb-6 pb-5 border-b border-earth-400/35">
          <Text className="text-lg font-bold text-earth-800 mb-4">Weekly Activity</Text>
          <View className="flex-row items-end justify-between h-24">
            {weeklyActivity.map((item, index) => (
              <View key={`${item.day}-${index}`} className="items-center">
                <View
                  className="w-8 bg-primary-200 rounded-t-lg"
                  style={{ height: item.value > 0 ? 20 + (item.value / maxWeeklyValue) * 40 : 8 }}
                />
                <Text className="text-earth-500 text-xs mt-2">{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text className="text-lg font-bold text-earth-800 mb-3">All Badges</Text>
        {achievements.map((achievement) => {
          const Icon =
            achievement.id === 'dedicated-learner'
              ? Flame
              : achievement.id === 'course-master'
                ? Award
                : Target;
          return (
            <View
              key={achievement.id}
              className={`flex-row items-center py-3 mb-0 border-b border-earth-400/30 ${
                !achievement.unlocked ? 'opacity-50' : ''
              }`}
            >
              <View className="w-12 h-12 rounded-xl bg-primary-100 items-center justify-center">
                <Icon size={24} color="#16a34a" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="font-semibold text-earth-800">{achievement.name}</Text>
                <Text className="text-earth-500 text-sm">{achievement.description}</Text>
              </View>
              {achievement.unlocked && (
                <View className="bg-primary-100 px-2 py-1 rounded-full">
                  <Text className="text-primary-700 text-xs font-medium">Unlocked</Text>
                </View>
              )}
            </View>
          );
        })}

        {hasCourseCompletionBadge ? (
          <View className="mt-6 mb-10">
            <Text className="text-lg font-bold text-earth-800 mb-3">Completion Badge Template</Text>
            <View className="mb-3">
              {effectiveBadges.map((badge) => {
                const isSharing = sharingBadgeId === badge.id;
                const isDownloading = downloadingBadgeId === badge.id;
                const isBusy = isSharing || isDownloading;
                return (
                  <View key={badge.id} className="border-b border-earth-400/30 py-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-earth-800 font-medium">{badge.badge_name}</Text>
                      <Text className="text-earth-500 text-xs">{badge.course_title}</Text>
                    </View>
                    <View
                      ref={(node) => {
                        badgeRefs.current[badge.id] = node;
                      }}
                      collapsable={false}
                    >
                      <CompletionBadgeTemplate
                        learnerName={learnerName}
                        courseTitle={badge.course_title}
                        awardedAt={badge.awarded_at ?? new Date().toISOString()}
                      />
                    </View>
                    <View className="mt-3 gap-2">
                      <Button
                        label={isSharing ? 'Sharing…' : 'Share badge'}
                        onPress={() => onShareBadge(badge.id)}
                        isLoading={isSharing}
                        disabled={isBusy}
                        fullWidth
                      />
                      <Button
                        label={isDownloading ? 'Saving…' : 'Download badge'}
                        onPress={() => onDownloadBadge(badge.id)}
                        isLoading={isDownloading}
                        disabled={isBusy}
                        variant="secondary"
                        fullWidth
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {hasCertificates ? (
          <View className="mt-2 mb-10">
            <Text className="text-lg font-bold text-earth-800 mb-3">Course Certificates</Text>
            <View className="mb-3">
              {certificates.map((certificate) => (
                <View
                  key={`certificate-row-${certificate.course_id}`}
                  className="flex-row items-center justify-between border-b border-earth-400/30 py-2"
                >
                  <Text className="text-earth-800 font-medium">Certificate</Text>
                  <Text className="text-earth-500 text-xs">{certificate.course_title}</Text>
                </View>
              ))}
            </View>
            {certificates.map((certificate) => (
              <View
                key={`certificate-visible-${certificate.course_id}`}
                ref={(node) => {
                  certificateRefs.current[certificate.course_id] = node;
                }}
                collapsable={false}
                className="mb-3"
              >
                <CompletionCertificateTemplate
                  learnerName={learnerName}
                  courseTitle={certificate.course_title}
                  awardedAt={certificate.completed_at}
                />
              </View>
            ))}
            <View className="mt-3 gap-2">
              <Button
                label={isSharingCertificate ? 'Sharing…' : 'Share certificate'}
                onPress={onShareCertificate}
                isLoading={isSharingCertificate}
                disabled={isSharingCertificate || isDownloadingCertificate || isDownloadingAllCertificates}
                fullWidth
              />
              <Button
                label={isDownloadingCertificate ? 'Saving…' : 'Download certificate'}
                onPress={onDownloadCertificate}
                isLoading={isDownloadingCertificate}
                disabled={isDownloadingCertificate || isSharingCertificate || isDownloadingAllCertificates}
                variant="secondary"
                fullWidth
              />
              <Button
                label={isDownloadingAllCertificates ? 'Saving all…' : 'Download all certificates'}
                onPress={onDownloadAllCertificates}
                isLoading={isDownloadingAllCertificates}
                disabled={isDownloadingAllCertificates || isSharingCertificate || isDownloadingCertificate}
                variant="secondary"
                fullWidth
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}
