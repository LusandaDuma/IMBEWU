/**
 * @fileoverview Admin analytics data access service.
 */

import { supabase } from '@/services/supabase';
import type { UserRole } from '@/types';

export interface AdminDashboardStat {
  totalUsers: number;
  totalCourses: number;
  activeLearners: number;
  completionRate: number;
}

export interface AdminActivityItem {
  id: string;
  text: string;
  timestamp: string;
}

export interface AdminDashboardAnalytics {
  stats: AdminDashboardStat;
  recentActions: AdminActivityItem[];
}

/** Deeper platform metrics for the admin home “Advanced” section. */
export interface AdminAdvancedStats {
  usersByRole: {
    admin: number;
    coordinator: number;
    student: number;
    independent: number;
  };
  publishedCourses: number;
  draftCourses: number;
  totalEnrolments: number;
  totalClasses: number;
  newEnrolments7d: number;
  badgesAwarded: number;
  activeLogins7d: number;
}

export interface AdminUserItem {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string | null;
  updatedAt: string;
}

type ProfileSummary = {
  id: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'coordinator' | 'student' | 'independent';
  updated_at: string;
};

type CourseSummary = {
  id: string;
  title: string;
  updated_at: string;
  is_published: boolean;
};

type EnrolmentSummary = {
  id: string;
  enrolled_at: string;
  user_id: string;
};

type AdminUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  updated_at: string;
};

function buildDisplayName(firstName?: string, lastName?: string): string {
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return fullName || 'A learner';
}

function roleLabel(role: ProfileSummary['role']): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'coordinator':
      return 'Coordinator';
    case 'student':
      return 'Student';
    case 'independent':
      return 'Independent learner';
    default:
      return 'User';
  }
}

async function getRecentAdminActivity(limit: number): Promise<AdminActivityItem[]> {
  const [recentProfilesResult, recentCoursesResult, recentEnrolmentsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, role, updated_at')
      .order('updated_at', { ascending: false })
      .limit(limit),
    supabase
      .from('courses')
      .select('id, title, updated_at, is_published')
      .order('updated_at', { ascending: false })
      .limit(limit),
    supabase
      .from('course_enrolments')
      .select('id, enrolled_at, user_id')
      .order('enrolled_at', { ascending: false })
      .limit(limit),
  ]);

  if (recentProfilesResult.error) throw new Error(recentProfilesResult.error.message);
  if (recentCoursesResult.error) throw new Error(recentCoursesResult.error.message);
  if (recentEnrolmentsResult.error) {
    console.error('[adminService.getRecentAdminActivity] recent enrolments query failed:', recentEnrolmentsResult.error.message);
  }

  const profileActivity: AdminActivityItem[] = ((recentProfilesResult.data ?? []) as ProfileSummary[]).map((profile) => ({
    id: `profile-${profile.id}`,
    text: `${buildDisplayName(profile.first_name, profile.last_name)} joined as ${roleLabel(profile.role)}`,
    timestamp: profile.updated_at,
  }));

  const courseActivity: AdminActivityItem[] = ((recentCoursesResult.data ?? []) as CourseSummary[]).map((course) => ({
    id: `course-${course.id}`,
    text: course.is_published
      ? `Course "${course.title}" was published`
      : `Course "${course.title}" was updated`,
    timestamp: course.updated_at,
  }));

  const enrolments = (recentEnrolmentsResult.data ?? []) as EnrolmentSummary[];
  const enrolmentUserIds = [...new Set(enrolments.map((enrolment) => enrolment.user_id))];
  const { data: enrolmentProfiles, error: enrolmentProfilesError } = enrolmentUserIds.length
    ? await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', enrolmentUserIds)
    : { data: [], error: null };

  if (enrolmentProfilesError) {
    console.error('[adminService.getRecentAdminActivity] enrolment profiles lookup failed:', enrolmentProfilesError.message);
  }

  const profileNameById = new Map(
    ((enrolmentProfiles ?? []) as { id: string; first_name: string; last_name: string }[]).map((profile) => [
      profile.id,
      buildDisplayName(profile.first_name, profile.last_name),
    ])
  );

  const enrolmentActivity: AdminActivityItem[] = enrolments.map((enrolment) => ({
    id: `enrolment-${enrolment.id}`,
    text: `${profileNameById.get(enrolment.user_id) ?? 'A learner'} enrolled in a course`,
    timestamp: enrolment.enrolled_at,
  }));

  return [...profileActivity, ...courseActivity, ...enrolmentActivity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export async function getAdminDashboardAnalytics(): Promise<AdminDashboardAnalytics> {
  const [
    profilesResult,
    activeProfilesResult,
    coursesResult,
    progressResult,
    recentActions,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('lesson_progress').select('pct_complete'),
    getRecentAdminActivity(5),
  ]);

  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (activeProfilesResult.error) throw new Error(activeProfilesResult.error.message);
  if (coursesResult.error) throw new Error(coursesResult.error.message);
  if (progressResult.error) throw new Error(progressResult.error.message);

  const progressRows = progressResult.data ?? [];
  const completionRate = progressRows.length
    ? Math.round(progressRows.reduce((total, row) => total + (row.pct_complete ?? 0), 0) / progressRows.length)
    : 0;

  return {
    stats: {
      totalUsers: profilesResult.count ?? 0,
      totalCourses: coursesResult.count ?? 0,
      activeLearners: activeProfilesResult.count ?? 0,
      completionRate,
    },
    recentActions,
  };
}

export async function getAdminActivityFeed(): Promise<AdminActivityItem[]> {
  return getRecentAdminActivity(50);
}

/**
 * Broader platform counts (role mix, content, growth). Admin RLS or service-role client required.
 */
export async function getAdminAdvancedStats(): Promise<AdminAdvancedStats> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceIso = since.toISOString();

  const byRole = (role: UserRole) =>
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', role);

  const [
    adminC,
    coordC,
    studC,
    indepC,
    pubC,
    draftC,
    enrC,
    classC,
    newEnC,
    badgeC,
    login7C,
  ] = await Promise.all([
    byRole('admin'),
    byRole('coordinator'),
    byRole('student'),
    byRole('independent'),
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', false),
    supabase.from('course_enrolments').select('id', { count: 'exact', head: true }),
    supabase.from('classes').select('id', { count: 'exact', head: true }),
    supabase
      .from('course_enrolments')
      .select('id', { count: 'exact', head: true })
      .gte('enrolled_at', sinceIso),
    supabase.from('student_badges').select('id', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('last_login', 'is', null)
      .gte('last_login', sinceIso),
  ]);

  const firstErr =
    adminC.error ||
    coordC.error ||
    studC.error ||
    indepC.error ||
    pubC.error ||
    draftC.error ||
    enrC.error ||
    classC.error ||
    newEnC.error ||
    badgeC.error ||
    login7C.error;
  if (firstErr) {
    throw new Error(firstErr.message);
  }

  return {
    usersByRole: {
      admin: adminC.count ?? 0,
      coordinator: coordC.count ?? 0,
      student: studC.count ?? 0,
      independent: indepC.count ?? 0,
    },
    publishedCourses: pubC.count ?? 0,
    draftCourses: draftC.count ?? 0,
    totalEnrolments: enrC.count ?? 0,
    totalClasses: classC.count ?? 0,
    newEnrolments7d: newEnC.count ?? 0,
    badgesAwarded: badgeC.count ?? 0,
    activeLogins7d: login7C.count ?? 0,
  };
}

export async function getAdminUsers(): Promise<AdminUserItem[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, is_active, last_login, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as AdminUserRow[]).map((user) => ({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    isActive: user.is_active,
    lastLogin: user.last_login,
    updatedAt: user.updated_at,
  }));
}

export async function updateAdminUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}
