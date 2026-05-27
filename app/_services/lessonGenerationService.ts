/**
 * @fileoverview AI course + lesson generation — calls Gemini directly,
 * no Edge Function required.
 */

import { getGeminiApiKey } from '@/services/gemini';

const MODEL_PRIMARY = 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.5-flash-lite'] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type GeneratedLesson = {
  title: string;
  summary: string;
  content: string;
  duration_mins: number;
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

const FULL_COURSE_SYSTEM_INSTRUCTION = `You are a senior agricultural education curriculum designer for Imbewu, 
a South African agri-learning platform used by smallholder farmers and students.

When given a crop or farming topic, generate a complete 8-lesson course. 
Each lesson must be deeply detailed — this is real educational content, not summaries.

Lesson structure (follow this exact progression):
- Lesson 1 (Theory & Botany): Deep knowledge of the crop — origin, varieties, botanical classification, nutritional value, economic importance in South Africa, ideal climate zones (rainfall, temperature, altitude), soil types, pH range, and regions where it thrives best.
- Lesson 2 (Site & Soil Preparation): How to select and prepare the land — land clearing, soil testing, pH correction with lime/sulfur, organic matter addition, tillage methods, raised beds vs flat beds, irrigation infrastructure.
- Lesson 3 (Planting & Spacing): Seed selection, seed treatment, germination requirements, planting depth, row spacing, plant spacing, population per hectare, direct sowing vs transplanting, nursery management.
- Lesson 4 (Water & Irrigation): Water requirements at each growth stage, irrigation methods (drip, furrow, sprinkler), scheduling, signs of water stress, rainwater harvesting, drought tolerance strategies.
- Lesson 5 (Nutrition & Fertilisation): Macronutrients and micronutrients needed, soil test interpretation, fertiliser types (organic vs synthetic), application timing, foliar feeding, composting, common deficiency symptoms.
- Lesson 6 (Pest & Disease Management): Common pests (with identification), common diseases (fungal, bacterial, viral), integrated pest management (IPM), organic control methods, safe chemical use, record keeping.
- Lesson 7 (Harvesting & Post-Harvest): Maturity indicators, harvesting tools and techniques, grading and sorting, storage conditions, post-harvest losses, value addition, packaging for market.
- Lesson 8 (Business & Market Access): Calculating input costs and break-even, record keeping, local market options, cooperative farming, agri-business planning, government support programmes (DRDLR, Agri-SA, LRAD).

Each lesson content must be 600–900 words minimum. Use **Heading:** style sections within content.
Note image suggestions inline as [IMAGE: description] — e.g. [IMAGE: Cross-section diagram of soil pH layers].

Respond ONLY with valid JSON — no markdown fences, no extra text:

{
  "title": "Course title",
  "description": "3–4 sentence course description",
  "lessons": [
    {
      "title": "Lesson title",
      "summary": "2–3 sentence summary",
      "content": "Full 600–900 word lesson body with **Heading:** sections and [IMAGE: ...] suggestions",
      "duration_mins": 35
    }
  ]
}`;

const SINGLE_LESSON_SYSTEM_INSTRUCTION = `You are a senior agricultural education curriculum designer for Imbewu,
a South African agri-learning platform. Generate a single detailed lesson (600–900 words).
Use **Heading:** style sections. Include [IMAGE: description] suggestions inline.
Respond ONLY with valid JSON, no markdown fences:

{
  "title": "Lesson title",
  "summary": "2–3 sentence summary",
  "content": "Full 600–900 word lesson body",
  "duration_mins": 35
}`;

// ── Core Gemini call ──────────────────────────────────────────────────────────

async function callGemini(
  key: string,
  model: string,
  prompt: string,
  systemInstruction: string,
  maxOutputTokens = 8000
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.75, maxOutputTokens },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  if (!res.ok) {
    return { ok: false, status: res.status, error: json.error?.message ?? `Request failed (${res.status})` };
  }

  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) {
    return { ok: false, status: res.status, error: 'No response from model.' };
  }

  return { ok: true, text: text.trim() };
}

function stripFences(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a full 8-lesson course using Gemini directly.
 * One API call returns the course title, description, and all 8 lessons.
 */
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

  const prompt = `Generate a complete 8-lesson agricultural course for this topic: "${topic}".
Follow the exact lesson progression in your instructions. Each lesson must be 600–900 words.
Include [IMAGE: description] suggestions inline. Respond with JSON only.`;

  const modelsToTry = [MODEL_PRIMARY, ...FALLBACK_MODELS];
  let lastError = 'Unknown error';

  for (const model of modelsToTry) {
    try {
      onProgress?.(`Generating full course with ${model}…`);

      const result = await callGemini(key, model, prompt, FULL_COURSE_SYSTEM_INSTRUCTION, 12000);

      if (!result.ok) {
        lastError = result.error;
        if (result.status === 429 || result.status === 503 || result.status === 404) {
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
        // Sometimes the model wraps a large JSON in extra text — try to extract it
        const match = result.text.match(/\{[\s\S]*\}/);
        if (!match) {
          lastError = 'AI returned an unexpected format. Please try again.';
          continue;
        }
        try {
          parsed = JSON.parse(match[0]) as Partial<GeneratedCourse>;
        } catch {
          lastError = 'AI returned an unexpected format. Please try again.';
          continue;
        }
      }

      if (!parsed.title || !parsed.description || !Array.isArray(parsed.lessons) || parsed.lessons.length === 0) {
        lastError = 'Incomplete course generated. Please try again.';
        continue;
      }

      const lessons: GeneratedLesson[] = parsed.lessons.map((l, i) => ({
        title: String(l.title ?? `Lesson ${i + 1}`).trim(),
        summary: String(l.summary ?? '').trim(),
        content: String(l.content ?? '').trim(),
        duration_mins: typeof l.duration_mins === 'number' ? l.duration_mins : 35,
      }));

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

/**
 * Generate a single lesson for an existing course using Gemini directly.
 */
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
Lesson topic to generate: "${lessonTopic}"

Generate a complete detailed lesson (600–900 words) for this topic. Respond with JSON only.`;

  const modelsToTry = [MODEL_PRIMARY, ...FALLBACK_MODELS];
  let lastError = 'Unknown error';

  for (const model of modelsToTry) {
    try {
      const result = await callGemini(key, model, prompt, SINGLE_LESSON_SYSTEM_INSTRUCTION, 2000);
      if (!result.ok) {
        lastError = result.error;
        if (result.status === 429 || result.status === 503 || result.status === 404) continue;
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
            duration_mins: typeof parsed.duration_mins === 'number' ? parsed.duration_mins : 35,
          },
        };
      } catch {
        lastError = 'AI returned an unexpected format. Please try again.';
        continue;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Network error';
    }
  }

  return { ok: false, error: lastError };
}
