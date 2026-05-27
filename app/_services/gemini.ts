/**
 * @fileoverview Backwards-compatible AI chat helper.
 *
 * This file used to call Gemini. The project now uses OpenAI.
 * We keep the public function names to avoid touching many screens.
 */

import { getOpenAiApiKey, openAiGenerateText, type OpenAiMessage } from '@/services/openai';

/** Default small/fast chat model for Nolwazi text replies. */
const DEFAULT_MODEL = 'gpt-4.1-mini';

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

export function getGeminiApiKey(): string | undefined {
  // Back-compat: old name, now returns OpenAI key.
  return getOpenAiApiKey();
}

export async function generateGeminiReply({
  systemInstruction,
  history,
  userMessage,
  model = DEFAULT_MODEL,
}: GenerateReplyParams): Promise<GenerateReplyResult> {
  const key = getOpenAiApiKey();
  if (!key?.trim()) {
    return {
      ok: false,
      error:
        'Missing OpenAI API key. Add EXPO_PUBLIC_OPENAI_API_KEY to your .env and restart Expo.',
    };
  }

  try {
    const messages: OpenAiMessage[] = [
      { role: 'system', content: systemInstruction },
      ...history.map((h) => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts.map((p) => p.text).join(''),
      })),
      { role: 'user', content: userMessage },
    ];

    const result = await openAiGenerateText({
      apiKey: key,
      model,
      messages,
      temperature: 0.65,
      maxOutputTokens: 512,
    });

    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, text: result.text };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error';
    return { ok: false, error: message };
  }
}
