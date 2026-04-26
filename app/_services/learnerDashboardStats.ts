/**
 * @fileoverview Aggregated stats for student / independent dashboard headers.
 */

import { getCourseProgressSummary, getEnrolmentsByUser } from '@/services/supabase';

export type LearnerDashboardStats = {
  coursesEnrolled: number;
  averageProgressPct: number;
  lessonsCompleted: number;
  lessonsTotal: number;
};

export async function getLearnerDashboardStats(userId: string): Promise<LearnerDashboardStats> {
  const enrolments = await getEnrolmentsByUser(userId);
  if (enrolments.length === 0) {
    return {
      coursesEnrolled: 0,
      averageProgressPct: 0,
      lessonsCompleted: 0,
      lessonsTotal: 0,
    };
  }

  const summaries = await Promise.all(
    enrolments.map((e) => getCourseProgressSummary(userId, e.course_id)),
  );

  const lessonsTotal = summaries.reduce((acc, s) => acc + s.totalLessons, 0);
  const lessonsCompleted = summaries.reduce((acc, s) => acc + s.completedLessons, 0);
  const averageProgressPct = Math.round(
    summaries.reduce((acc, s) => acc + s.averagePctComplete, 0) / summaries.length,
  );

  return {
    coursesEnrolled: enrolments.length,
    averageProgressPct: averageProgressPct,
    lessonsCompleted: lessonsCompleted,
    lessonsTotal: lessonsTotal,
  };
}
