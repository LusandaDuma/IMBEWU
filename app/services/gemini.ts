/**
 * @fileoverview Gemini Generative Language API (REST) for Nolwazi / LMS chat.
 */

import Constants from 'expo-constants';

/** Points at current Flash; avoids 2.0-flash free-tier quota issues seen on some keys. */
const DEFAULT_MODEL = 'gemini-flash-latest';

const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'] as const;

function getApiKey(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ??
    (Constants.expoConfig?.extra as { geminiApiKey?: string } | undefined)?.geminiApiKey
  );
}

export type GeminiChatRole = 'user' | 'model';

export type GeminiContent = {
  role: GeminiChatRole;
  parts: { text: string }[];
};

export type GenerateReplyParams = {
  systemInstruction: string;
  history: GeminiContent[];
  userMessage: string;
  model?: string;
};

export type GenerateReplyResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

/**
 * Sends one turn using prior turns as `contents` (user/model alternating).
 */
async function callGenerateContent(
  key: string,
  model: string,
  body: object
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    error?: { message?: string; code?: number };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  if (!res.ok) {
    const msg = json.error?.message ?? `Request failed (${res.status})`;
    return { ok: false, status: res.status, error: msg };
  }

  const text =
    json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

  if (!text.trim()) {
    return { ok: false, status: res.status, error: 'No response text from the model.' };
  }

  return { ok: true, text: text.trim() };
}

export async function generateGeminiReply({
  systemInstruction,
  history,
  userMessage,
  model = DEFAULT_MODEL,
}: GenerateReplyParams): Promise<GenerateReplyResult> {
  const key = getApiKey();
  if (!key?.trim()) {
    return {
      ok: false,
      error:
        'Missing Gemini API key. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env and restart Expo.',
    };
  }

  const contents: GeminiContent[] = [
    ...history,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const body = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 512,
    },
  };

  const modelsToTry = [model, ...FALLBACK_MODELS.filter((m) => m !== model)];

  try {
    let lastError = 'Unknown error';

    for (const m of modelsToTry) {
      const result = await callGenerateContent(key, m, body);
      if (result.ok) {
        return { ok: true, text: result.text };
      }

      lastError = result.error;
      const retryable = result.status === 429 || result.status === 503;
      const notFound = result.status === 404;
      if (retryable || notFound) {
        continue;
      }
      return { ok: false, error: result.error };
    }

    return { ok: false, error: lastError };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error';
    return { ok: false, error: message };
  }
}
