/**
 * @fileoverview Student achievements screen
 */

import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { downloadBadgeTemplate, downloadBadgeTemplates, shareBadgeTemplate } from '@/services/badgeTemplateService';
import {
  getStudentAchievementsData,
  syncAndGetEarnedCourseBadges,
} from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, BookOpen, Clock, Flame, Target } from 'lucide-react-native';
import { useRef, useState, type RefObject } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Button, CompletionBadgeTemplate } from '@/components/shared';

export default function AchievementsScreen() {
  const { user, profile } = useAuthStore();
  const badgeRefs = useRef<Record<string, View | null>>({});
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const { data, refetch } = useQuery({
    queryKey: ['student-achievements', user?.id],
    queryFn: () => (user ? getStudentAchievementsData(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });
  const { data: earnedBadges = [], refetch: refetchEarnedBadges } = useQuery({
    queryKey: ['earned-course-badges', user?.id],
    queryFn: () => (user ? syncAndGetEarnedCourseBadges(user.id, 'class_based') : Promise.resolve([])),
    enabled: !!user,
  });

  useRefetchOnFocus(refetch, !!user);
  useRefetchOnFocus(refetchEarnedBadges, !!user);

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
  const effectiveBadges = earnedBadges;
  const hasCourseCompletionBadge = effectiveBadges.length > 0;
  const learnerName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'Imbewu learner';

  const onShareBadge = async () => {
    try {
      setIsSharing(true);
      const firstBadge = effectiveBadges[0];
      const firstBadgeRef = firstBadge ? badgeRefs.current[firstBadge.id] : null;
      if (!firstBadge || !firstBadgeRef) {
        throw new Error('Badges are still loading. Please try again in a moment.');
      }
      await shareBadgeTemplate({ current: firstBadgeRef }, learnerName);
    } catch (error) {
      Alert.alert('Share failed', error instanceof Error ? error.message : 'Could not share badge right now.');
    } finally {
      setIsSharing(false);
    }
  };

  const onDownloadBadge = async () => {
    try {
      setIsDownloading(true);
      const firstBadge = effectiveBadges[0];
      const firstBadgeRef = firstBadge ? badgeRefs.current[firstBadge.id] : null;
      if (!firstBadge || !firstBadgeRef) {
        throw new Error('Badges are still loading. Please try again in a moment.');
      }
      const uri = await downloadBadgeTemplate({ current: firstBadgeRef }, learnerName, firstBadge.course_title);
      Alert.alert('Badge saved', `Saved to:\n${uri}`);
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Could not save badge right now.');
    } finally {
      setIsDownloading(false);
    }
  };

  const onDownloadAllBadges = async () => {
    try {
      setIsDownloadingAll(true);
      const badgeDownloads = effectiveBadges
        .map((badge) => {
          const ref = badgeRefs.current[badge.id];
          return ref ? { ref: { current: ref }, courseTitle: badge.course_title } : null;
        })
        .filter((item): item is { ref: RefObject<View | null>; courseTitle?: string } => item !== null);

      if (badgeDownloads.length === 0) {
        throw new Error('Badges are still loading. Please try again in a moment.');
      }

      await downloadBadgeTemplates(badgeDownloads, learnerName);
      Alert.alert('Badges saved', `Downloaded ${badgeDownloads.length} badge${badgeDownloads.length === 1 ? '' : 's'}.`);
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Could not save all badges right now.');
    } finally {
      setIsDownloadingAll(false);
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
            <Text className="text-lg font-bold text-earth-800 mb-3">Completion Badge Templates</Text>
            <View className="mb-3">
              {effectiveBadges.map((badge) => (
                <View key={badge.id} className="flex-row items-center justify-between border-b border-earth-400/30 py-2">
                  <Text className="text-earth-800 font-medium">{badge.badge_name}</Text>
                  <Text className="text-earth-500 text-xs">{badge.course_title}</Text>
                </View>
              ))}
            </View>
            {effectiveBadges.map((badge) => (
              <View
                key={`visible-${badge.id}`}
                ref={(node) => {
                  badgeRefs.current[badge.id] = node;
                }}
                collapsable={false}
                className="mb-3"
              >
                <CompletionBadgeTemplate
                  learnerName={learnerName}
                  courseTitle={badge.course_title}
                  awardedAt={badge.awarded_at ?? new Date().toISOString()}
                />
              </View>
            ))}
            <View className="mt-3 gap-2">
              <Button
                label={isSharing ? 'Sharing…' : 'Share badge'}
                onPress={onShareBadge}
                isLoading={isSharing}
                disabled={isSharing || isDownloading || isDownloadingAll}
                fullWidth
              />
              <Button
                label={isDownloading ? 'Saving…' : 'Download badge'}
                onPress={onDownloadBadge}
                isLoading={isDownloading}
                disabled={isDownloading || isSharing || isDownloadingAll}
                variant="secondary"
                fullWidth
              />
              <Button
                label={isDownloadingAll ? 'Saving all…' : 'Download all badges'}
                onPress={onDownloadAllBadges}
                isLoading={isDownloadingAll}
                disabled={isDownloadingAll || isSharing || isDownloading}
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
