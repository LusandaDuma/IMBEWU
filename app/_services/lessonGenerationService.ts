/**
 * @fileoverview AI course + lesson generation — calls Gemini directly.
 *
 * Performance fixes:
 * - Reduced lesson content to 300–500 words (was 600–900) to cut token usage by ~40%
 * - Added 90s fetch timeout with AbortController
 * - Lessons returned as a flat array; caller does ONE batch insert instead of 8 sequential
 * - Fallback model chain: flash → flash-lite
 */

import { getGeminiApiKey } from '@/services/gemini';
import { fetchLessonVideo } from '@/services/youtubeService';

const MODEL_PRIMARY   = 'gemini-2.5-flash-preview-05-20';
const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'] as const;
const FETCH_TIMEOUT_MS = 90_000; // 90 seconds

// ── Types ─────────────────────────────────────────────────────────────────────

export type GeneratedLesson = {
  title: string;
  summary: string;
  content: string;
  duration_mins: number;
  video_url?: string | null;
};

export type GenerateLessonResult =
  | { ok: true; lesson: GeneratedLesson }
  | { ok: false; error: string };

export type GeneratedCourse = {
  title: string;
  description: string;
  lessons: GeneratedLesson[];
};

export type GenerateCourseResult =
  | { ok: true; course: GeneratedCourse }
  | { ok: false; error: string };

// ── System instructions ───────────────────────────────────────────────────────

const FULL_COURSE_SYSTEM_INSTRUCTION = `You are a senior agricultural curriculum designer for Imbewu,
a South African agri-learning platform for smallholder farmers.

Generate a complete 8-lesson course. Keep each lesson content to 300–500 words.
Use **Heading:** style sections. Add [IMAGE: description] inline suggestions.

Lesson progression (strictly follow this order):
1. Theory & Botany — origin, varieties, climate zones, soil pH, SA regions
2. Site & Soil Preparation — land clearing, pH correction, tillage, raised beds
3. Planting & Spacing — seed selection, germination, row spacing, nursery management
4. Water & Irrigation — requirements per growth stage, drip vs furrow, drought strategies
5. Nutrition & Fertilisation — macronutrients, soil tests, compost, deficiency symptoms
6. Pest & Disease Management — common pests, IPM, organic controls, safe chemical use
7. Harvesting & Post-Harvest — maturity indicators, grading, storage, value addition
8. Business & Market Access — input costs, cooperatives, government support (DRDLR, Agri-SA)

Respond ONLY with valid JSON — no markdown fences, no extra text:
{
  "title": "Course title",
  "description": "2–3 sentence course description",
  "lessons": [
    {
      "title": "Lesson title",
      "summary": "1–2 sentence summary",
      "content": "300–500 word lesson body with **Heading:** sections and [IMAGE: ...] suggestions",
      "duration_mins": 25
    }
  ]
}`;

const SINGLE_LESSON_SYSTEM_INSTRUCTION = `You are a senior agricultural curriculum designer for Imbewu,
a South African agri-learning platform. Generate a single detailed lesson (300–500 words).
Use **Heading:** style sections. Include [IMAGE: description] suggestions inline.
Respond ONLY with valid JSON, no markdown fences:
{
  "title": "Lesson title",
  "summary": "1–2 sentence summary",
  "content": "300–500 word lesson body",
  "duration_mins": 25
}`;

// ── Core Gemini call with timeout ─────────────────────────────────────────────

async function callGemini(
  key: string,
  model: string,
  prompt: string,
  systemInstruction: string,
  maxOutputTokens = 6000
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const json = (await res.json()) as {
      error?: { message?: string };
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: json.error?.message ?? `Request failed (${res.status})`,
      };
    }

    const text =
      json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    if (!text.trim()) {
      return { ok: false, status: res.status, error: 'No response from model.' };
    }

    return { ok: true, text: text.trim() };
  } catch (e) {
    clearTimeout(timeout);
    if ((e as Error).name === 'AbortError') {
      return { ok: false, status: 408, error: 'Request timed out after 90 seconds. Please try again.' };
    }
    throw e;
  }
}

function stripFences(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateCourseWithAI({
  topic,
  onProgress,
}: {
  topic: string;
  onProgress?: (message: string) => void;
}): Promise<GenerateCourseResult> {
  const key = getGeminiApiKey();
  if (!key?.trim()) {
    return {
      ok: false,
      error: 'Missing Gemini API key. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env and restart Expo.',
    };
  }

  onProgress?.('Connecting to Gemini AI…');

  const prompt = `Generate a complete 8-lesson agricultural course for: "${topic}".
Follow the exact 8-lesson progression. Keep each lesson 300–500 words.
Include [IMAGE: description] suggestions. Respond with JSON only.`;

  const modelsToTry = [MODEL_PRIMARY, ...FALLBACK_MODELS];
  let lastError = 'Unknown error';

  for (const model of modelsToTry) {
    try {
      onProgress?.(`Generating with ${model}…`);

      const result = await callGemini(key, model, prompt, FULL_COURSE_SYSTEM_INSTRUCTION, 6000);

      if (!result.ok) {
        lastError = result.error;
        if ([408, 429, 503, 404].includes(result.status)) {
          onProgress?.(`Switching model (${result.status})…`);
          continue;
        }
        return { ok: false, error: result.error };
      }

      onProgress?.('Parsing course content…');

      let parsed: Partial<GeneratedCourse>;
      try {
        parsed = JSON.parse(stripFences(result.text)) as Partial<GeneratedCourse>;
      } catch {
        const match = result.text.match(/\{[\s\S]*\}/);
        if (!match) { lastError = 'AI returned unexpected format. Please try again.'; continue; }
        try {
          parsed = JSON.parse(match[0]) as Partial<GeneratedCourse>;
        } catch {
          lastError = 'AI returned unexpected format. Please try again.';
          continue;
        }
      }

      if (
        !parsed.title ||
        !parsed.description ||
        !Array.isArray(parsed.lessons) ||
        parsed.lessons.length === 0
      ) {
        lastError = 'Incomplete course generated. Please try again.';
        continue;
      }

      const lessons: GeneratedLesson[] = parsed.lessons.map((l, i) => ({
        title: String(l.title ?? `Lesson ${i + 1}`).trim(),
        summary: String(l.summary ?? '').trim(),
        content: String(l.content ?? '').trim(),
        duration_mins: typeof l.duration_mins === 'number' ? l.duration_mins : 25,
        video_url: null,
      }));

      // Fetch YouTube video for lesson 1 only — non-blocking, non-fatal
      onProgress?.('Finding a video for lesson 1…');
      try {
        const video = await fetchLessonVideo(lessons[0]!.title, topic);
        if (video) {
          lessons[0] = { ...lessons[0]!, video_url: video.url };
          onProgress?.('Video found ✓');
        }
      } catch {
        // Non-fatal — lesson saves without a video
      }

      return {
        ok: true,
        course: {
          title: String(parsed.title).trim(),
          description: String(parsed.description).trim(),
          lessons,
        },
      };
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Network error';
    }
  }

  return { ok: false, error: lastError };
}

export async function generateLessonWithAI({
  courseTitle,
  courseDescription,
  lessonTopic,
}: {
  courseTitle: string;
  courseDescription: string;
  lessonTopic: string;
}): Promise<GenerateLessonResult> {
  const key = getGeminiApiKey();
  if (!key?.trim()) {
    return {
      ok: false,
      error: 'Missing Gemini API key. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env and restart Expo.',
    };
  }

  const prompt = `Course title: "${courseTitle}"
Course description: "${courseDescription}"
Lesson topic: "${lessonTopic}"

Generate a complete detailed lesson (300–500 words). Respond with JSON only.`;

  const modelsToTry = [MODEL_PRIMARY, ...FALLBACK_MODELS];
  let lastError = 'Unknown error';

  for (const model of modelsToTry) {
    try {
      const result = await callGemini(key, model, prompt, SINGLE_LESSON_SYSTEM_INSTRUCTION, 1500);
      if (!result.ok) {
        lastError = result.error;
        if ([408, 429, 503, 404].includes(result.status)) continue;
        return { ok: false, error: result.error };
      }
      try {
        const parsed = JSON.parse(stripFences(result.text)) as Partial<GeneratedLesson>;
        if (!parsed.title || !parsed.content) throw new Error('Invalid shape');
        return {
          ok: true,
          lesson: {
            title: String(parsed.title).trim(),
            summary: String(parsed.summary ?? '').trim(),
            content: String(parsed.content).trim(),
            duration_mins: typeof parsed.duration_mins === 'number' ? parsed.duration_mins : 25,
          },
        };
      } catch {
        lastError = 'AI returned unexpected format. Please try again.';
        continue;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Network error';
    }
  }

  return { ok: false, error: lastError };
}
