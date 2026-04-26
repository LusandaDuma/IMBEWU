/**
 * Nolwazi Copilot — mediation API (Edge Function).
 * Authenticated JWT only. Tools are allowlisted; RBAC enforced here before any DB work.
 * Env (automatic on hosted Supabase): SUPABASE_URL, SUPABASE_ANON_KEY
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';

const cors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type UserRole = 'admin' | 'coordinator' | 'student' | 'independent';

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  language: string;
  is_active: boolean;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonRes(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

function isAllowedToolForRole(tool: string, role: UserRole): boolean {
  const allAuth = ['getMyProfile', 'getMyEnrolments', 'getProgressForCourse', 'getPublishedCourses'] as const;
  const learnerEnrol = ['enrolIfEligible'] as const;

  if ((allAuth as readonly string[]).includes(tool)) return true;
  if ((learnerEnrol as readonly string[]).includes(tool)) {
    return role === 'student' || role === 'independent';
  }
  return false;
}

function parseArgs(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

async function getAuthUser(
  supabase: SupabaseClient
): Promise<{ id: string; email?: string } | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email };
}

async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, language, is_active')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data as Profile;
}

function profilePayload(p: Profile) {
  return {
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    role: p.role,
    language: p.language,
    is_active: p.is_active,
  };
}

async function handleGetMyEnrolments(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('course_enrolments')
    .select(
      'id, user_id, course_id, enrolment_type, enrolled_at, courses(id, title, description, offline_url, is_published, created_at)'
    )
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  const rows = (data ?? []) as {
    id: string;
    user_id: string;
    course_id: string;
    enrolment_type: string;
    enrolled_at: string;
    courses: unknown;
  }[];

  const enrolments = rows.map((row) => {
    const c = row.courses;
    const course = Array.isArray(c) ? c[0] : c;
    return {
      id: row.id,
      course_id: row.course_id,
      enrolment_type: row.enrolment_type,
      enrolled_at: row.enrolled_at,
      course: course ?? null,
    };
  });

  return { ok: true as const, data: { enrolments } };
}

async function handleGetPublishedCourses(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, description, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, data: { courses: data ?? [] } };
}

async function handleGetProgressForCourse(supabase: SupabaseClient, userId: string, courseId: string) {
  const { data: courseRow, error: cErr } = await supabase
    .from('courses')
    .select('id, title, is_published')
    .eq('id', courseId)
    .maybeSingle();
  if (cErr) {
    return { ok: false as const, error: cErr.message };
  }
  if (!courseRow) {
    return { ok: false as const, error: 'Course not found.' };
  }
  if (!courseRow.is_published) {
    const { data: enr } = await supabase
      .from('course_enrolments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();
    if (!enr) {
      return { ok: false as const, error: 'This course is not available.' };
    }
  }

  const { count: lessonCount, error: lErr } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId);
  if (lErr) {
    return { ok: false as const, error: lErr.message };
  }
  const total = lessonCount ?? 0;

  const { data: progressRows, error: pErr } = await supabase
    .from('lesson_progress')
    .select('id, user_id, lesson_id, pct_complete, is_completed, completed_at, lessons!inner(id, course_id)')
    .eq('user_id', userId)
    .eq('lessons.course_id', courseId);

  if (pErr) {
    return { ok: false as const, error: pErr.message };
  }

  const pr = (progressRows ?? []) as {
    id: string;
    lesson_id: string;
    pct_complete: number;
    is_completed: boolean;
  }[];
  const completed = pr.filter((r) => r.is_completed).length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    ok: true as const,
    data: {
      courseId,
      courseTitle: courseRow.title,
      totalLessons: total,
      completedLessons: completed,
      completionPct,
      lessonsProgress: pr.map((r) => ({
        lesson_id: r.lesson_id,
        pct_complete: r.pct_complete,
        is_completed: r.is_completed,
      })),
    },
  };
}

async function handleEnrolIfEligible(
  supabase: SupabaseClient,
  profile: Profile,
  userId: string,
  courseId: string
) {
  if (profile.role !== 'student' && profile.role !== 'independent') {
    return {
      ok: false as const,
      error: 'Only student and independent accounts can use self-enrol from the catalogue.',
    };
  }
  if (!profile.is_active) {
    return { ok: false as const, error: 'Account is not active.' };
  }

  const { data: course, error: cErr } = await supabase
    .from('courses')
    .select('id, title, is_published')
    .eq('id', courseId)
    .maybeSingle();
  if (cErr) {
    return { ok: false as const, error: cErr.message };
  }
  if (!course) {
    return { ok: false as const, error: 'Course not found.' };
  }
  if (!course.is_published) {
    return { ok: false as const, error: 'Course is not open for self-enrolment (not published).' };
  }

  const { data: existing } = await supabase
    .from('course_enrolments')
    .select('id, enrolment_type, enrolled_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) {
    return {
      ok: true as const,
      data: {
        alreadyEnrolled: true,
        message: 'You are already enrolled in this course.',
        enrolment: existing,
        course: { id: course.id, title: course.title },
      },
    };
  }

  const { data: inserted, error: insErr } = await supabase
    .from('course_enrolments')
    .insert({
      user_id: userId,
      course_id: courseId,
      enrolment_type: 'independent',
    })
    .select('id, user_id, course_id, enrolment_type, enrolled_at')
    .single();

  if (insErr) {
    return { ok: false as const, error: insErr.message };
  }

  return {
    ok: true as const,
    data: {
      alreadyEnrolled: false,
      message: 'Enrolled successfully.',
      enrolment: inserted,
      course: { id: course.id, title: course.title },
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }
  if (req.method !== 'POST') {
    return jsonRes({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseKey) {
    return jsonRes({ error: 'Server misconfiguration.' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    return jsonRes({ error: 'Missing or invalid Authorization header.' }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const user = await getAuthUser(supabase);
  if (!user) {
    return jsonRes({ error: 'Invalid or expired session.' }, 401);
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile) {
    return jsonRes({ error: 'Profile not found.' }, 403);
  }

  let body: { tool?: string; args?: unknown };
  try {
    body = (await req.json()) as { tool?: string; args?: unknown };
  } catch {
    return jsonRes({ error: 'Invalid JSON body.' }, 400);
  }

  const tool = typeof body.tool === 'string' ? body.tool : '';
  const args = parseArgs(body.args);

  if (!tool || !/^[a-zA-Z0-9_]+$/.test(tool)) {
    return jsonRes({ error: 'Invalid tool name.' }, 400);
  }

  if (!isAllowedToolForRole(tool, profile.role)) {
    return jsonRes(
      { error: 'This action is not allowed for your role.', code: 'FORBIDDEN' },
      403
    );
  }

  try {
    switch (tool) {
      case 'getMyProfile': {
        return jsonRes({ ok: true, tool, result: profilePayload(profile) });
      }
      case 'getMyEnrolments': {
        const r = await handleGetMyEnrolments(supabase, user.id);
        return jsonRes(r.ok ? { ok: true, tool, result: r.data } : { ok: false, tool, error: r.error });
      }
      case 'getPublishedCourses': {
        const r = await handleGetPublishedCourses(supabase);
        return jsonRes(r.ok ? { ok: true, tool, result: r.data } : { ok: false, tool, error: r.error });
      }
      case 'getProgressForCourse': {
        const courseId = typeof args.courseId === 'string' ? args.courseId : '';
        if (!UUID_RE.test(courseId)) {
          return jsonRes({ ok: false, tool, error: 'Invalid courseId (UUID required).' }, 400);
        }
        const r = await handleGetProgressForCourse(supabase, user.id, courseId);
        return jsonRes(r.ok ? { ok: true, tool, result: r.data } : { ok: false, tool, error: r.error });
      }
      case 'enrolIfEligible': {
        const courseId = typeof args.courseId === 'string' ? args.courseId : '';
        if (!UUID_RE.test(courseId)) {
          return jsonRes({ ok: false, tool, error: 'Invalid courseId (UUID required).' }, 400);
        }
        const r = await handleEnrolIfEligible(supabase, profile, user.id, courseId);
        return jsonRes(r.ok ? { ok: true, tool, result: r.data } : { ok: false, tool, error: r.error });
      }
      default:
        return jsonRes({ error: 'Unknown tool.', code: 'UNKNOWN_TOOL' }, 400);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error';
    return jsonRes({ ok: false, error: message }, 500);
  }
});
