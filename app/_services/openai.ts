/**
 * @fileoverview Minimal OpenAI Responses API client (client-side).
 *
 * Note: This project previously used Gemini with `EXPO_PUBLIC_GEMINI_API_KEY`.
 * To keep upgrades painless, we allow either:
 * - EXPO_PUBLIC_OPENAI_API_KEY (preferred)
 * - EXPO_PUBLIC_GEMINI_API_KEY (fallback; user may have replaced it with an OpenAI key)
 */

import Constants from 'expo-constants';

export function getOpenAiApiKey(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_OPENAI_API_KEY ??
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ??
    (Constants.expoConfig?.extra as { openaiApiKey?: string; geminiApiKey?: string } | undefined)?.openaiApiKey ??
    (Constants.expoConfig?.extra as { openaiApiKey?: string; geminiApiKey?: string } | undefined)?.geminiApiKey
  );
}

export type OpenAiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OpenAiTextResult =
  | { ok: true; text: string }
  | { ok: false; status: number; error: string };

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

function extractResponseText(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  const anyJson = json as any;

  // Some SDKs / gateways provide a direct `output_text`.
  const direct = typeof anyJson.output_text === 'string' ? anyJson.output_text : '';
  if (direct.trim()) return direct.trim();

  // Standard Responses API shape: `output` is an array of items with `content[]`.
  const output = Array.isArray(anyJson.output) ? anyJson.output : [];
  const chunks: string[] = [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === 'string') chunks.push(part.text);
      // Some tool outputs can nest `output_text` or similar fields.
      if (typeof part?.output_text === 'string') chunks.push(part.output_text);
    }
  }
  return chunks.join('').trim();
}

export async function openAiGenerateText(params: {
  apiKey: string;
  model: string;
  messages: OpenAiMessage[];
  maxOutputTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<OpenAiTextResult> {
  const res = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      input: params.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: params.temperature ?? 0.7,
      max_output_tokens: params.maxOutputTokens ?? 1024,
    }),
    signal: params.signal,
  });

  const json = (await res.json()) as any;

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: json.error?.message ?? `Request failed (${res.status})`,
    };
  }

  const text = extractResponseText(json);
  if (!text) {
    return { ok: false, status: 500, error: 'No response text from model.' };
  }

  return { ok: true, text };
}

