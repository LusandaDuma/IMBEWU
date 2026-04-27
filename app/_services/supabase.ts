/**
 * @fileoverview Supabase client and service functions
 */

import type {
    Class,
    ClassMember,
    Course,
    CourseEnrolment,
    Lesson,
    LessonProgress,
    Profile,
    Question,
    QuestionOption,
    Quiz
} from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    /**
     * Use the same no-op lock as non-browser runtimes. Default {@link
     * navigatorLock} (Web Lock API) often throws
     * `NavigatorLockAcquireTimeoutError` on Expo web with React Strict Mode,
     * fast refresh, or concurrent `getSession` — same root cause as
     * gotrue-js's lock recovery when another request "steals" the lock.
     * Trade-off: no cross-tab mutex (acceptable for a single-tab mobile-style app).
     */
    lock: async <R,>(_name: string, _acquireTimeout: number, fn: () => Promise<R>) => fn(),
  },
});
export { supabase };
export default supabase;

const COURSE_CACHE_KEY = 'cache:courses:v1';
const COURSE_CACHE_MAX = 300;

type CachedCoursesPayload = {
  updatedAt: string;
  items: Course[];
};

async function readCachedCourses(): Promise<Course[]> {
  try {
    const raw = await AsyncStorage.getItem(COURSE_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CachedCoursesPayload;
    if (!parsed || !Array.isArray(parsed.items)) return [];
    return parsed.items;
  } catch {
    return [];
  }
}

async function writeCachedCourses(courses: Course[]): Promise<void> {
  try {
    const unique = new Map<string, Course>();
    for (const course of courses) {
      if (course?.id) unique.set(course.id, course);
    }
    const items = [...unique.values()].slice(0, COURSE_CACHE_MAX);
    const payload: CachedCoursesPayload = { updatedAt: new Date().toISOString(), items };
    await AsyncStorage.setItem(COURSE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore cache write failures.
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

// Course services
export async function getCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching courses:', error);
    const cached = await readCachedCourses();
    return cached.filter((course) => course.is_published);
  }
  const courses = (data || []) as Course[];
  void writeCachedCourses(courses);
  return courses;
}

export async function getAllCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching all courses:', error);
    return readCachedCourses();
  }
  const courses = (data || []) as Course[];
  void writeCachedCourses(courses);
  return courses;
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  if (!courseId?.trim()) {
    return null;
  }

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching course:', error);
    const cached = await readCachedCourses();
    return cached.find((course) => course.id === courseId) ?? null;
  }

  if (!data) {
    const cached = await readCachedCourses();
    return cached.find((course) => course.id === courseId) ?? null;
  }

  const found = data as Course;
  const cached = await readCachedCourses();
  await writeCachedCourses([found, ...cached]);
  return found;
}

type CreateCoursePayload = {
  created_by: string;
  title: string;
  description?: string | null;
  offline_url?: string | null;
  is_published?: boolean;
};

export async function createCourse(course: CreateCoursePayload): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      created_by: course.created_by,
      title: course.title,
      description: course.description ?? null,
      offline_url: course.offline_url ?? null,
      is_published: course.is_published ?? false,
    })
    .select('id, created_by, title, description, offline_url, is_published, created_at, updated_at')
    .single();
  
  if (error) {
    console.error('Error creating course:', error);
    return null;
  }
  return data as Course;
}

export async function updateCourse(courseId: string, updates: Partial<Course>): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating course:', error);
    return null;
  }
  if (data == null) {
    console.error('Error updating course: no row returned (check id and RLS).');
    return null;
  }
  return data;
}

export async function deleteCourse(courseId: string): Promise<boolean> {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) {
    console.error('Error deleting course:', error);
    return false;
  }
  return true;
}

// Lesson services
export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
  return data || [];
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single();
  
  if (error) {
    console.error('Error fetching lesson:', error);
    return null;
  }
  return data;
}

// Progress services
export async function getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching lesson progress:', error);
    return null;
  }
  return data;
}

/** Progress rows for many lessons in one round-trip (course outline / gating). */
export async function getLessonProgressByLessonIds(
  userId: string,
  lessonIds: string[]
): Promise<Map<string, LessonProgress>> {
  if (!lessonIds.length) {
    return new Map();
  }
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds);

  if (error) {
    console.error('Error fetching lesson progress batch:', error);
    return new Map();
  }
  return new Map((data || []).map((row) => [row.lesson_id, row as LessonProgress]));
}

export type CourseProgressSummary = {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  averagePctComplete: number;
};

export async function getCourseProgressSummary(
  userId: string,
  courseId: string
): Promise<CourseProgressSummary> {
  const emptySummary: CourseProgressSummary = {
    courseId,
    totalLessons: 0,
    completedLessons: 0,
    averagePctComplete: 0,
  };

  const { data: lessonsData, error: lessonsError } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId);

  if (lessonsError) {
    console.error('Error fetching lessons for progress summary:', lessonsError);
    return emptySummary;
  }

  const lessonIds = (lessonsData || []).map((lesson) => lesson.id);
  if (!lessonIds.length) {
    return emptySummary;
  }

  const { data: progressData, error: progressError } = await supabase
    .from('lesson_progress')
    .select('lesson_id, pct_complete, is_completed')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds);

  if (progressError) {
    console.error('Error fetching course progress summary:', progressError);
    return {
      ...emptySummary,
      totalLessons: lessonIds.length,
    };
  }

  const progressByLessonId = new Map(
    (progressData || []).map((row) => [
      row.lesson_id,
      { pctComplete: row.pct_complete || 0, isCompleted: !!row.is_completed },
    ])
  );

  let completedLessons = 0;
  let totalPctAcrossLessons = 0;

  for (const lessonId of lessonIds) {
    const row = progressByLessonId.get(lessonId);
    if (row?.isCompleted) {
      completedLessons += 1;
    }
    totalPctAcrossLessons += row?.pctComplete || 0;
  }

  const averagePctComplete = Math.round(totalPctAcrossLessons / lessonIds.length);

  return {
    courseId,
    totalLessons: lessonIds.length,
    completedLessons,
    averagePctComplete,
  };
}

export async function updateLessonProgress(
  userId: string, 
  lessonId: string, 
  percentage: number
): Promise<LessonProgress | null> {
  const isCompleted = percentage >= 100;
  const completedAt = isCompleted ? new Date().toISOString() : null;
  
  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      pct_complete: percentage,
      is_completed: isCompleted,
      completed_at: completedAt,
    }, {
      onConflict: 'user_id,lesson_id'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error updating lesson progress:', error);
    return null;
  }
  return data;
}

export type EarnedCourseBadge = {
  id: string;
  awarded_at: string;
  badge_id: string;
  badge_name: string;
  course_id: string;
  course_title: string;
  criteria: string | null;
};

export async function checkAndAwardCourseBadges(userId: string, courseId: string): Promise<number> {
  const { data, error } = await supabase.rpc('check_and_award_badges', {
    p_user_id: userId,
    p_course_id: courseId,
  });

  if (error) {
    console.error('Error awarding course badges:', error);
    return 0;
  }

  const row = Array.isArray(data) ? data[0] : null;
  const awardedCount = typeof row?.awarded_count === 'number' ? row.awarded_count : 0;
  return awardedCount;
}

export async function getEarnedCourseBadges(userId: string): Promise<EarnedCourseBadge[]> {
  const { data, error } = await supabase
    .from('student_badges')
    .select('id, awarded_at, badges!inner(id, name, criteria, course_id, courses!inner(title))')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false });

  if (error) {
    console.error('Error fetching earned course badges:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    awarded_at: row.awarded_at,
    badge_id: row.badges.id,
    badge_name: row.badges.name,
    course_id: row.badges.course_id,
    course_title: row.badges.courses.title,
    criteria: row.badges.criteria ?? null,
  }));
}

// Quiz services
export async function getQuizByLesson(lessonId: string): Promise<Quiz | null> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('lesson_id', lessonId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching quiz:', error);
    return null;
  }
  return data;
}

export async function getQuestionsByQuiz(quizId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
  return data || [];
}

export async function getQuestionOptions(questionId: string): Promise<QuestionOption[]> {
  const { data, error } = await supabase
    .from('question_options')
    .select('*')
    .eq('question_id', questionId)
    .order('order_index', { ascending: true });
  
  if (error) {
    console.error('Error fetching question options:', error);
    return [];
  }
  return data || [];
}

// Enrolment services
export async function getEnrolmentsByUser(userId: string): Promise<(CourseEnrolment & { courses: Course })[]> {
  const { data, error } = await supabase
    .from('course_enrolments')
    .select('*, courses(*)')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching enrolments:', error);
    return [];
  }
  return data || [];
}

export async function enrollInCourse(
  userId: string, 
  courseId: string, 
  enrolmentType: 'independent' | 'class_based'
): Promise<CourseEnrolment | null> {
  const { data, error } = await supabase
    .from('course_enrolments')
    .insert({
      user_id: userId,
      course_id: courseId,
      enrolment_type: enrolmentType,
      enrolled_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error enrolling in course:', error);
    return null;
  }
  return data;
}

// Class services
export async function getClassesByCoordinator(coordinatorId: string): Promise<Class[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('created_by', coordinatorId);
  
  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
  return data || [];
}

export async function getClassByJoinCode(joinCode: string): Promise<Class | null> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('join_code', joinCode)
    .single();
  
  if (error) {
    console.error('Error fetching class by join code:', error);
    return null;
  }
  return data;
}

type CreateClassPayload = {
  created_by: string;
  course_id: string;
  name: string;
  join_code?: string;
};

export type StudentSearchResult = {
  id: string;
  first_name: string;
  last_name: string;
  role: Profile['role'];
};

function generateClientJoinCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * chars.length);
    code += chars[idx];
  }
  return code;
}

export async function createClass(classData: CreateClassPayload): Promise<Class | null> {
  const requestedJoinCode = classData.join_code?.trim() || generateClientJoinCode();

  const createWithCode = (joinCode: string) =>
    supabase.rpc('create_class_atomic', {
      p_coordinator_id: classData.created_by,
      p_course_id: classData.course_id,
      p_name: classData.name,
      p_join_code: joinCode,
    });

  let { data, error } = await createWithCode(requestedJoinCode);

  // Retry once with a fresh code if uniqueness collision occurs.
  if (error?.code === '23505') {
    ({ data, error } = await createWithCode(generateClientJoinCode()));
  }

  if (error) {
    console.error('Error creating class:', error);
    return null;
  }
  return data as Class;
}

export async function getClassById(classId: string): Promise<Class | null> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();

  if (error) {
    console.error('Error fetching class:', error);
    return null;
  }
  return data;
}

export async function updateClass(
  classId: string,
  updates: Pick<Class, 'name' | 'is_active'>
): Promise<Class | null> {
  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', classId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating class:', error);
    return null;
  }
  return data;
}

export async function getClassMembers(classId: string): Promise<ClassMember[]> {
  const { data, error } = await supabase
    .from('class_members')
    .select('id, class_id, user_id, role, joined_at')
    .eq('class_id', classId)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('Error fetching class members:', error);
    return [];
  }

  const members = (data || []) as ClassMember[];
  const userIds = [...new Set(members.map((member) => member.user_id))];
  if (userIds.length === 0) {
    return members;
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', userIds);

  if (profilesError) {
    console.error('Error fetching member profiles:', profilesError);
    return members;
  }

  const profileById = new Map(
    (profilesData || []).map((profile) => [profile.id, profile])
  );

  return members.map((member) => ({
    ...member,
    profile: profileById.get(member.user_id) || null,
  }));
}

export type AddStudentToClassResult =
  | 'joined'
  | 'already-in-class'
  | 'already-enrolled'
  | 'class-not-found'
  | 'join-failed';

export type RemoveStudentFromClassResult =
  | 'removed'
  | 'not-in-class'
  | 'class-not-found'
  | 'remove-failed';

export async function addStudentToClass(classId: string, studentId: string): Promise<AddStudentToClassResult> {
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('course_id')
    .eq('id', classId)
    .single();

  if (classError || !classData) {
    console.error('Error fetching class for add student:', classError);
    return 'class-not-found';
  }

  const { data: existingEnrolment, error: enrolmentLookupError } = await supabase
    .from('course_enrolments')
    .select('id')
    .eq('user_id', studentId)
    .eq('course_id', classData.course_id)
    .maybeSingle();

  if (enrolmentLookupError) {
    console.error('Error checking existing student course enrolment:', enrolmentLookupError);
    return 'join-failed';
  }

  if (existingEnrolment) {
    return 'already-enrolled';
  }

  const { error: memberError } = await supabase.from('class_members').insert({
    class_id: classId,
    user_id: studentId,
    role: 'student',
  });

  if (memberError?.code === '23505') {
    return 'already-in-class';
  }

  if (memberError) {
    console.error('Error adding class member:', memberError);
    return 'join-failed';
  }

  const { error: enrolError } = await supabase.from('course_enrolments').insert({
    user_id: studentId,
    course_id: classData.course_id,
    enrolment_type: 'class_based',
  });

  if (enrolError) {
    console.error('Error enrolling student in course:', enrolError);
    return 'join-failed';
  }

  return 'joined';
}

export async function removeStudentFromClass(
  classId: string,
  studentId: string
): Promise<RemoveStudentFromClassResult> {
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('course_id')
    .eq('id', classId)
    .single();

  if (classError || !classData) {
    console.error('Error fetching class for remove student:', classError);
    return 'class-not-found';
  }

  const { data: memberData, error: memberLookupError } = await supabase
    .from('class_members')
    .select('id')
    .eq('class_id', classId)
    .eq('user_id', studentId)
    .eq('role', 'student')
    .maybeSingle();

  if (memberLookupError) {
    console.error('Error checking class member before removal:', memberLookupError);
    return 'remove-failed';
  }

  if (!memberData) {
    return 'not-in-class';
  }

  const { error: memberDeleteError } = await supabase
    .from('class_members')
    .delete()
    .eq('class_id', classId)
    .eq('user_id', studentId)
    .eq('role', 'student');

  if (memberDeleteError) {
    console.error('Error removing class member:', memberDeleteError);
    return 'remove-failed';
  }

  const { error: enrolDeleteError } = await supabase
    .from('course_enrolments')
    .delete()
    .eq('user_id', studentId)
    .eq('course_id', classData.course_id)
    .eq('enrolment_type', 'class_based');

  if (enrolDeleteError) {
    console.error('Error removing class-based enrolment:', enrolDeleteError);
    return 'remove-failed';
  }

  return 'removed';
}

export async function searchStudentsByName(searchText: string): Promise<StudentSearchResult[]> {
  const query = searchText.trim();
  if (query.length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role')
    .eq('role', 'student')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .order('first_name', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error searching students:', error);
    return [];
  }

  return (data || []) as StudentSearchResult[];
}

export type CoordinatorAnalyticsStat = {
  totalStudents: number;
  activeClasses: number;
  averageCompletionPct: number;
  certificates: number;
};

export type CoordinatorActivityItem = {
  id: string;
  text: string;
  timestamp: string;
};

export type CoordinatorAnalytics = {
  stats: CoordinatorAnalyticsStat;
  recentActivity: CoordinatorActivityItem[];
};

export type IndependentAchievementItem = {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
};

export type IndependentAchievementStats = {
  hoursLearned: number;
  courses: number;
  dayStreak: number;
};

export type IndependentAchievementsData = {
  stats: IndependentAchievementStats;
  weeklyActivity: { day: string; value: number }[];
  achievements: IndependentAchievementItem[];
};

function toDateKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function getDayStreak(dateKeys: string[]): number {
  const available = new Set(dateKeys);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (available.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getDefaultAchievements(): IndependentAchievementItem[] {
  return [
    { id: 'first-steps', name: 'First Steps', description: 'Complete your first lesson', unlocked: false },
    { id: 'dedicated-learner', name: 'Dedicated Learner', description: 'Learn for 7 days straight', unlocked: false },
    { id: 'course-master', name: 'Course Master', description: 'Complete your first course', unlocked: false },
  ];
}

function getZeroWeeklyActivity(): { day: string; value: number }[] {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
      value: 0,
    };
  });
}

async function getLearnerAchievementsData(
  userId: string,
  enrolmentTypes: Array<'independent' | 'class_based'>
): Promise<IndependentAchievementsData> {
  const emptyData: IndependentAchievementsData = {
    stats: {
      hoursLearned: 0,
      courses: 0,
      dayStreak: 0,
    },
    weeklyActivity: [],
    achievements: getDefaultAchievements(),
  };

  const { data: enrolmentsData, error: enrolmentsError } = await supabase
    .from('course_enrolments')
    .select('course_id, enrolment_type')
    .eq('user_id', userId)
    .in('enrolment_type', enrolmentTypes);

  if (enrolmentsError) {
    console.error('Error fetching learner enrolments for achievements:', enrolmentsError);
    return emptyData;
  }

  const enrolments = enrolmentsData || [];
  const courseIds = [...new Set(enrolments.map((item) => item.course_id))];
  if (!courseIds.length) {
    return {
      ...emptyData,
      weeklyActivity: getZeroWeeklyActivity(),
    };
  }

  const { data: lessonsData, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, course_id, duration_mins')
    .in('course_id', courseIds);

  if (lessonsError) {
    console.error('Error fetching learner lessons for achievements:', lessonsError);
    return {
      ...emptyData,
      stats: {
        ...emptyData.stats,
        courses: courseIds.length,
      },
      weeklyActivity: getZeroWeeklyActivity(),
    };
  }

  const lessons = lessonsData || [];
  const lessonIds = lessons.map((lesson) => lesson.id);
  if (!lessonIds.length) {
    return {
      ...emptyData,
      stats: {
        ...emptyData.stats,
        courses: courseIds.length,
      },
      weeklyActivity: getZeroWeeklyActivity(),
    };
  }

  const { data: progressData, error: progressError } = await supabase
    .from('lesson_progress')
    .select('lesson_id, pct_complete, is_completed, completed_at')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds);

  if (progressError) {
    console.error('Error fetching learner lesson progress for achievements:', progressError);
    return {
      ...emptyData,
      stats: {
        ...emptyData.stats,
        courses: courseIds.length,
      },
      weeklyActivity: getZeroWeeklyActivity(),
    };
  }

  const progressRows = progressData || [];
  const completedLessonIds = new Set(
    progressRows.filter((row) => row.is_completed).map((row) => row.lesson_id)
  );
  const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const lessonsByCourse = new Map<string, { total: number; completed: number }>();

  for (const lesson of lessons) {
    const course = lessonsByCourse.get(lesson.course_id) || { total: 0, completed: 0 };
    course.total += 1;
    if (completedLessonIds.has(lesson.id)) {
      course.completed += 1;
    }
    lessonsByCourse.set(lesson.course_id, course);
  }

  const completedMinutes = [...completedLessonIds].reduce((sum, lessonId) => {
    const lesson = lessonsById.get(lessonId);
    return sum + (lesson?.duration_mins || 0);
  }, 0);

  const completedDateKeys = progressRows
    .filter((row) => row.is_completed && !!row.completed_at)
    .map((row) => toDateKey(row.completed_at || ''));

  const dayStreak = getDayStreak([...new Set(completedDateKeys)]);
  const courseMasterUnlocked = [...lessonsByCourse.values()].some(
    (value) => value.total > 0 && value.completed === value.total
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activityCountByDate = new Map<string, number>();
  for (const dateKey of completedDateKeys) {
    activityCountByDate.set(dateKey, (activityCountByDate.get(dateKey) || 0) + 1);
  }

  const weeklyActivity = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const dateKey = date.toISOString().slice(0, 10);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
      value: activityCountByDate.get(dateKey) || 0,
    };
  });

  return {
    stats: {
      hoursLearned: Math.round((completedMinutes / 60) * 10) / 10,
      courses: courseIds.length,
      dayStreak,
    },
    weeklyActivity,
    achievements: [
      {
        id: 'first-steps',
        name: 'First Steps',
        description: 'Complete your first lesson',
        unlocked: completedLessonIds.size > 0,
      },
      {
        id: 'dedicated-learner',
        name: 'Dedicated Learner',
        description: 'Learn for 7 days straight',
        unlocked: dayStreak >= 7,
      },
      {
        id: 'course-master',
        name: 'Course Master',
        description: 'Complete your first course',
        unlocked: courseMasterUnlocked,
      },
    ],
  };
}

export async function getIndependentAchievementsData(userId: string): Promise<IndependentAchievementsData> {
  return getLearnerAchievementsData(userId, ['independent']);
}

export async function getStudentAchievementsData(userId: string): Promise<IndependentAchievementsData> {
  return getLearnerAchievementsData(userId, ['class_based']);
}

export async function getCoordinatorAnalytics(coordinatorId: string): Promise<CoordinatorAnalytics> {
  const emptyData: CoordinatorAnalytics = {
    stats: {
      totalStudents: 0,
      activeClasses: 0,
      averageCompletionPct: 0,
      certificates: 0,
    },
    recentActivity: [],
  };

  const classes = await getClassesByCoordinator(coordinatorId);
  if (classes.length === 0) {
    return emptyData;
  }

  const classIds = classes.map((item) => item.id);
  const courseIds = [...new Set(classes.map((item) => item.course_id))];

  const { data: classMembersData, error: classMembersError } = await supabase
    .from('class_members')
    .select('id, class_id, user_id, role, joined_at')
    .in('class_id', classIds)
    .eq('role', 'student')
    .order('joined_at', { ascending: false });

  if (classMembersError) {
    console.error('Error fetching coordinator class members:', classMembersError);
    return emptyData;
  }

  const classMembers = (classMembersData || []) as ClassMember[];
  const studentIds = [...new Set(classMembers.map((member) => member.user_id))];

  const { data: profilesData, error: profilesError } = studentIds.length
    ? await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds)
    : { data: [], error: null };

  if (profilesError) {
    console.error('Error fetching coordinator student profiles:', profilesError);
  }

  const profileById = new Map(
    (profilesData || []).map((profile) => [
      profile.id,
      `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Student',
    ])
  );

  const { data: lessonsData, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title')
    .in('course_id', courseIds);

  if (lessonsError) {
    console.error('Error fetching coordinator lessons:', lessonsError);
    return {
      ...emptyData,
      stats: {
        ...emptyData.stats,
        totalStudents: studentIds.length,
        activeClasses: classes.filter((item) => item.is_active).length,
      },
      recentActivity: classMembers.slice(0, 5).map((member) => ({
        id: `join-${member.id}`,
        text: `${profileById.get(member.user_id) || 'Student'} joined a class`,
        timestamp: member.joined_at,
      })),
    };
  }

  const lessonIds = (lessonsData || []).map((lesson) => lesson.id);
  const lessonTitleById = new Map((lessonsData || []).map((lesson) => [lesson.id, lesson.title]));

  const { data: progressData, error: progressError } = lessonIds.length
    ? await supabase
        .from('lesson_progress')
        .select('id, user_id, lesson_id, pct_complete, is_completed, completed_at')
        .in('lesson_id', lessonIds)
        .in('user_id', studentIds)
    : { data: [], error: null };

  if (progressError) {
    console.error('Error fetching coordinator lesson progress:', progressError);
  }

  const progressRows = (progressData || []) as Pick<
    LessonProgress,
    'id' | 'user_id' | 'lesson_id' | 'pct_complete' | 'is_completed' | 'completed_at'
  >[];

  const totalProgress = progressRows.reduce((sum, row) => sum + (row.pct_complete || 0), 0);
  const averageCompletionPct = progressRows.length ? Math.round(totalProgress / progressRows.length) : 0;
  const certificates = progressRows.filter((row) => row.is_completed).length;

  const joinEvents: CoordinatorActivityItem[] = classMembers.slice(0, 8).map((member) => ({
    id: `join-${member.id}`,
    text: `${profileById.get(member.user_id) || 'Student'} joined a class`,
    timestamp: member.joined_at,
  }));

  const completionEvents: CoordinatorActivityItem[] = progressRows
    .filter((row) => row.is_completed && !!row.completed_at)
    .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
    .slice(0, 8)
    .map((row) => ({
      id: `complete-${row.id}`,
      text: `${profileById.get(row.user_id) || 'Student'} completed "${lessonTitleById.get(row.lesson_id) || 'a lesson'}"`,
      timestamp: row.completed_at || '',
    }));

  const recentActivity = [...joinEvents, ...completionEvents]
    .filter((item) => !!item.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  return {
    stats: {
      totalStudents: studentIds.length,
      activeClasses: classes.filter((item) => item.is_active).length,
      averageCompletionPct,
      certificates,
    },
    recentActivity,
  };
}
