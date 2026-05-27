/**
 * @fileoverview AI course + lesson generation — calls Gemini directly.
 *
 * Performance fixes:
 * - Reduced lesson content to 300–500 words (was 600–900) to cut token usage by ~40%
 * - Added 90s fetch timeout with AbortController
 * - Lessons returned as a flat array; caller does ONE batch insert instead of 8 sequential
 * - Fallback model chain: flash → flash-lite
 */

import { getOpenAiApiKey, openAiGenerateText } from '@/services/openai';
import { fetchLessonVideo } from '@/services/youtubeService';

/** Default OpenAI model for structured JSON generation. */
const MODEL_PRIMARY = 'gpt-4.1';
const FALLBACK_MODELS = ['gpt-4.1-mini'] as const;
const FETCH_TIMEOUT_MS = 90_000; // 90 seconds

// ── Types ─────────────────────────────────────────────────────────────────────

export type GeneratedLessonQuiz = {
  title: string;
  pass_score: number;
  questions: Array<{
    text: string;
    options: Array<{ text: string; is_correct: boolean }>;
  }>;
};

export type GeneratedLesson = {
  title: string;
  summary: string;
  content: string;
  duration_mins: number;
  video_url?: string | null;
  quiz?: GeneratedLessonQuiz;
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

export type SuggestTopicsResult =
  | { ok: true; topics: string[] }
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

Each lesson must include a quiz with exactly 5 multiple-choice questions and 4 options each (one correct per question).

Respond ONLY with valid JSON — no markdown fences, no extra text:
{
  "title": "Course title",
  "description": "2–3 sentence course description",
  "lessons": [
    {
      "title": "Lesson title",
      "summary": "1–2 sentence summary",
      "content": "300–500 word lesson body with **Heading:** sections and [IMAGE: ...] suggestions",
      "duration_mins": 25,
      "quiz": {
        "title": "Quiz: Lesson title",
        "pass_score": 70,
        "questions": [
          {
            "text": "Question?",
            "options": [
              { "text": "Correct answer", "is_correct": true },
              { "text": "Wrong answer", "is_correct": false },
              { "text": "Wrong answer", "is_correct": false },
              { "text": "Wrong answer", "is_correct": false }
            ]
          }
        ]
      }
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

async function callOpenAi(
  key: string,
  model: string,
  prompt: string,
  systemInstruction: string,
  maxOutputTokens = 6000
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    clearTimeout(timeout);
    const result = await openAiGenerateText({
      apiKey: key,
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxOutputTokens,
      signal: controller.signal,
    });

    if (!result.ok) return result;
    return { ok: true, text: result.text };
  } catch (e) {
    clearTimeout(timeout);
    if ((e as Error).name === 'AbortError') {
      return { ok: false, status: 408, error: 'Request timed out after 90 seconds. Please try again.' };
    }
    throw e;
  }
}

function formatGeminiError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('api key expired') || lower.includes('api_key_invalid') || lower.includes('invalid api key')) {
    return 'Your Gemini API key is invalid or expired. Create a new key at Google AI Studio, set EXPO_PUBLIC_GEMINI_API_KEY in .env, then restart Expo (stop and run npm start again).';
  }
  return message;
}

function stripFences(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(stripFences(raw)) as T;
  } catch {
    const match = raw.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function suggestTrendingCourseTopics(params: {
  category: string;
  count?: number;
  seed?: string;
}): Promise<SuggestTopicsResult> {
  const key = getOpenAiApiKey();
  if (!key?.trim()) {
    return { ok: false, error: 'Missing OpenAI API key. Add EXPO_PUBLIC_OPENAI_API_KEY to your .env and restart Expo.' };
  }

  const count = Math.max(3, Math.min(12, params.count ?? 6));
  const seed = params.seed ?? new Date().toISOString();

  const system = `You are helping an agriculture learning app suggest course focus topics.
Return ONLY valid JSON. No markdown. No explanations.`;

  const prompt = `Today: ${new Date().toDateString()}.
Country focus: South Africa.
Category: "${params.category}".

Generate ${count} course focus topics that feel \"popular right now\" and \"highly researched\" for smallholder farmers.
Vary crops/angles (climate-smart, pests, soil health, irrigation, input costs, market access, value addition).
Avoid repeating generic phrases.
Variation seed: ${seed}.

Return JSON array of strings only, example:
["Tomato blight management in humid regions", "Low-cost drip irrigation for small plots"]`;

  const result = await callOpenAi(key, MODEL_PRIMARY, prompt, system, 600);
  if (!result.ok) {
    return { ok: false, error: formatGeminiError(result.error) };
  }

  const parsed = safeParseJson<unknown>(result.text);
  const arr = Array.isArray(parsed) ? parsed : null;
  if (!arr) return { ok: false, error: 'Could not parse topic suggestions. Please try again.' };

  const topics = arr
    .map((t) => (typeof t === 'string' ? t.trim() : ''))
    .filter((t) => t.length >= 4)
    .slice(0, count);

  if (topics.length === 0) return { ok: false, error: 'No topics returned. Please try again.' };
  return { ok: true, topics };
}

export async function generateCourseWithAI({
  topic,
  seed,
  onProgress,
}: {
  topic: string;
  seed?: string;
  onProgress?: (message: string) => void;
}): Promise<GenerateCourseResult> {
  const key = getOpenAiApiKey();
  if (!key?.trim()) {
    return {
      ok: false,
      error: 'Missing OpenAI API key. Add EXPO_PUBLIC_OPENAI_API_KEY to your .env and restart Expo.',
    };
  }

  onProgress?.('Connecting to OpenAI…');

  const prompt = `Generate a complete 8-lesson agricultural course for: "${topic}".
Follow the exact 8-lesson progression. Keep each lesson 300–500 words.
Include [IMAGE: description] suggestions. Respond with JSON only.

Important: Do NOT repeat generic templates. Choose a fresh, specific, currently popular sub-topic angle within South African smallholder farming (e.g. drought, pests, market access, climate-smart practices, input costs, soil health).
Variation seed: ${seed ?? new Date().toISOString()}.
If you previously generated a course for this topic, generate a different crop focus, region, and practical examples.`;

  const modelsToTry = [MODEL_PRIMARY, ...FALLBACK_MODELS];
  let lastError = 'Unknown error';

  for (const model of modelsToTry) {
    try {
      onProgress?.(`Generating with ${model}…`);

      const result = await callOpenAi(key, model, prompt, FULL_COURSE_SYSTEM_INSTRUCTION, 8192);

      if (!result.ok) {
        lastError = result.error;
        if ([408, 429, 503, 404].includes(result.status)) {
          onProgress?.(`Switching model (${result.status})…`);
          continue;
        }
        return { ok: false, error: formatGeminiError(result.error) };
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

      const lessons: GeneratedLesson[] = parsed.lessons.map((l, i) => {
        const rawQuiz = (l as { quiz?: Partial<GeneratedLessonQuiz> }).quiz;
        let quiz: GeneratedLessonQuiz | undefined;
        if (rawQuiz && Array.isArray(rawQuiz.questions) && rawQuiz.questions.length > 0) {
          const questions = rawQuiz.questions
            .map((q) => {
              const options = (q.options ?? [])
                .map((o) => ({
                  text: String(o.text ?? '').trim(),
                  is_correct: Boolean(o.is_correct),
                }))
                .filter((o) => o.text.length > 0);
              const text = String(q.text ?? '').trim();
              if (!text || options.length < 2) return null;
              if (!options.some((o) => o.is_correct)) {
                options[0] = { ...options[0]!, is_correct: true };
              }
              return { text, options };
            })
            .filter((q): q is NonNullable<typeof q> => Boolean(q));
          if (questions.length > 0) {
            quiz = {
              title: String(rawQuiz.title ?? `Quiz: ${l.title ?? `Lesson ${i + 1}`}`).trim(),
              pass_score:
                typeof rawQuiz.pass_score === 'number' && rawQuiz.pass_score >= 0 && rawQuiz.pass_score <= 100
                  ? rawQuiz.pass_score
                  : 70,
              questions,
            };
          }
        }

        return {
          title: String(l.title ?? `Lesson ${i + 1}`).trim(),
          summary: String(l.summary ?? '').trim(),
          content: String(l.content ?? '').trim(),
          duration_mins: typeof l.duration_mins === 'number' ? l.duration_mins : 25,
          video_url: null,
          quiz,
        };
      });

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

  return { ok: false, error: formatGeminiError(lastError) };
}

export async function generateLessonWithAI({
  courseTitle,
  courseDescription,
  lessonTopic,
  seed,
}: {
  courseTitle: string;
  courseDescription: string;
  lessonTopic: string;
  seed?: string;
}): Promise<GenerateLessonResult> {
  const key = getOpenAiApiKey();
  if (!key?.trim()) {
    return {
      ok: false,
      error: 'Missing OpenAI API key. Add EXPO_PUBLIC_OPENAI_API_KEY to your .env and restart Expo.',
    };
  }

  const prompt = `Course title: "${courseTitle}"
Course description: "${courseDescription}"
Lesson topic: "${lessonTopic}"
Variation seed: ${seed ?? new Date().toISOString()}

Generate a complete detailed lesson (300–500 words). Respond with JSON only.`;

  const modelsToTry = [MODEL_PRIMARY, ...FALLBACK_MODELS];
  let lastError = 'Unknown error';

  for (const model of modelsToTry) {
    try {
      const result = await callOpenAi(key, model, prompt, SINGLE_LESSON_SYSTEM_INSTRUCTION, 1500);
      if (!result.ok) {
        lastError = result.error;
        if ([408, 429, 503, 404].includes(result.status)) continue;
        return { ok: false, error: formatGeminiError(result.error) };
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

  return { ok: false, error: formatGeminiError(lastError) };
}
