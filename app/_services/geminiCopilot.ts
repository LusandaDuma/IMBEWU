/**
 * @fileoverview Gemini + Copilot: function calling and orchestration loop.
 * The model may only use declared tools; server tools hit the Edge mediation API; client tools stay in-app.
 */

import { getGeminiApiKey } from '@/services/gemini';
import { invokeCopilotTool } from '@/services/copilotApi';
import { CLIENT_ONLY_COPILOT_TOOLS, runCopilotNavigateTo, runCopilotSignOut } from '@/services/copilotClientTools';
import type { Router } from 'expo-router';

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'] as const;
const MAX_TOOL_ROUNDS = 8;

function normalizeGeminiError(message: string): string {
  const lower = message.toLowerCase();
  const isQuota =
    lower.includes('quota exceeded') ||
    lower.includes('rate limit') ||
    lower.includes('resource_exhausted');
  if (!isQuota) {
    return message;
  }
  const retryMatch = message.match(/retry in\s+([\d.]+)s/i);
  const waitText = retryMatch ? ` Please retry in about ${Math.ceil(Number(retryMatch[1]))}s.` : '';
  return `Nolwazi is temporarily busy due to Gemini API quota limits.${waitText}`;
}

/** Gemini 1.5/2 REST content (includes tool parts). */
export type CopilotContentPart = {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
};

export type CopilotContent = { role: 'user' | 'model'; parts: CopilotContentPart[] };

type GenerateResult =
  | { kind: 'text'; text: string; modelContent: CopilotContent }
  | { kind: 'function'; functionCall: { name: string; args: Record<string, unknown> }; modelContent: CopilotContent }
  | { kind: 'error'; error: string };

const COPILOT_FUNCTION_DECLARATIONS = [
  {
    name: 'getMyProfile',
    description: 'Get the signed-in user profile: name, role, and status. Fails if not signed in.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getMyEnrolments',
    description: 'List courses the current user is enrolled in, with optional course titles and metadata.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getPublishedCourses',
    description: 'List all published course catalogue items (titles and ids).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getProgressForCourse',
    description: 'Get the user lesson progress and completion percentage for a specific course (courseId UUID).',
    parameters: {
      type: 'object',
      properties: {
        courseId: { type: 'string', description: 'UUID of the course' },
      },
      required: ['courseId'],
    },
  },
  {
    name: 'enrolIfEligible',
    description:
      'Enrol the current user in a published self-serve course if their role and prerequisites allow. Only for student or independent users.',
    parameters: {
      type: 'object',
      properties: {
        courseId: { type: 'string', description: 'UUID of the course' },
      },
      required: ['courseId'],
    },
  },
  {
    name: 'navigateTo',
    description:
      'Request navigation to a safe in-app path (e.g. /auth/login, /student/discover, /course/{uuid}, /nolwazi). The app validates the path; invalid paths are ignored.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Expo Router path starting with /' },
      },
      required: ['path'],
    },
  },
  {
    name: 'signOut',
    description: 'End the current session using the app sign-out flow. Does not ask for a password.',
    parameters: { type: 'object', properties: {} },
  },
];

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

async function callGenerateContent(
  key: string,
  model: string,
  body: object,
): Promise<
  { ok: true; json: Record<string, unknown> } | { ok: false; status: number; error: string }
> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = (json.error as { message?: string } | undefined)?.message ?? `Request failed (${res.status})`;
    return { ok: false, status: res.status, error: err };
  }
  return { ok: true, json };
}

function parseModelGenerateResult(
  json: Record<string, unknown>,
): { text?: string; functionCall?: { name: string; args: Record<string, unknown> } } {
  const candidates = json.candidates as
    | { content?: { parts?: unknown[]; role?: string } }[]
    | undefined;
  const parts = candidates?.[0]?.content?.parts as CopilotContentPart[] | undefined;
  if (!parts?.length) {
    return {};
  }

  for (const p of parts) {
    if (p?.functionCall?.name) {
      const name = p.functionCall.name;
      const args = asRecord(p.functionCall.args ?? {});
      return { functionCall: { name, args } };
    }
  }

  const text = parts
    .map((p) => p?.text ?? '')
    .join('')
    .trim();
  return { text: text || undefined };
}

/**
 * One Gemini round with function-calling config.
 */
async function oneGenerateRound(
  systemInstruction: string,
  contents: CopilotContent[],
  model: string = DEFAULT_MODEL,
): Promise<GenerateResult> {
  const key = getGeminiApiKey();
  if (!key?.trim()) {
    return { kind: 'error', error: 'Missing EXPO_PUBLIC_GEMINI_API_KEY' };
  }

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    tools: [
      {
        functionDeclarations: COPILOT_FUNCTION_DECLARATIONS,
      },
    ],
    toolConfig: {
      functionCallingConfig: {
        mode: 'AUTO',
      },
    },
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: 768,
    },
  };

  const modelsToTry = [model, ...FALLBACK_MODELS.filter((m) => m !== model)];

  let lastErr = 'Unknown';
  for (const m of modelsToTry) {
    const r = await callGenerateContent(key, m, body);
    if (!r.ok) {
      lastErr = normalizeGeminiError(r.error);
      if (r.status === 429 || r.status === 503 || r.status === 404) {
        if (r.status === 429 && lastErr.includes('quota limits')) {
          return { kind: 'error', error: lastErr };
        }
        continue;
      }
      return { kind: 'error', error: normalizeGeminiError(r.error) };
    }

    const content = (r.json.candidates as { content: CopilotContent }[] | undefined)?.[0]?.content;
    if (!content?.parts?.length) {
      return { kind: 'error', error: 'No model content returned.' };
    }

    const modelContent: CopilotContent = { role: 'model', parts: content.parts as CopilotContentPart[] };
    const parsed = parseModelGenerateResult(r.json);

    if (parsed.functionCall) {
      if (!COPILOT_FUNCTION_DECLARATIONS.some((d) => d.name === parsed.functionCall!.name)) {
        return { kind: 'error', error: 'Model requested an unknown tool (blocked).' };
      }
      return {
        kind: 'function',
        functionCall: parsed.functionCall,
        modelContent,
      };
    }

    if (parsed.text) {
      return { kind: 'text', text: parsed.text, modelContent };
    }

    return { kind: 'error', error: 'Empty model output.' };
  }

  return { kind: 'error', error: normalizeGeminiError(lastErr) };
}

export type ToolLogEntry = { name: string; ok: boolean; summary: string };

function buildToolFallbackReply(toolLog: ToolLogEntry[]): string {
  const success = toolLog.filter((t) => t.ok);
  if (!success.length) {
    return 'I could not complete that request right now. Please try again.';
  }
  if (success.some((t) => t.name === 'getProgressForCourse')) {
    const latestProgress = [...success].reverse().find((t) => t.name === 'getProgressForCourse');
    return `${latestProgress?.summary ?? 'I fetched your course progress.'} I can also explain the lesson step-by-step if you want.`;
  }
  const latest = success[success.length - 1];
  return `${latest?.summary ?? 'I completed the requested action.'} Tell me if you want a deeper explanation.`;
}

function summarizeResponse(name: string, payload: Record<string, unknown>): string {
  if (payload.error && typeof payload.error === 'string') {
    return `${name}: error — ${payload.error}`;
  }
  const r = (payload as { result?: { enrolments?: unknown[]; courses?: unknown[]; message?: string; alreadyEnrolled?: boolean } })
    .result;
  if (name === 'getMyEnrolments' && r && Array.isArray(r.enrolments)) {
    return `getMyEnrolments: ${r.enrolments.length} course(s)`;
  }
  if (name === 'getPublishedCourses' && r && Array.isArray(r.courses)) {
    return `getPublishedCourses: ${r.courses.length} item(s)`;
  }
  if (name === 'enrolIfEligible' && r && typeof (r as { message?: string }).message === 'string') {
    return `enrolIfEligible: ${(r as { message: string }).message}`;
  }
  if (name === 'navigateTo' && (payload as { navigated?: boolean; path?: string }).navigated) {
    return `navigateTo: ${(payload as { path?: string }).path ?? 'ok'}`;
  }
  if (name === 'signOut' && (payload as { signedOut?: boolean }).signedOut) {
    return 'signOut: completed';
  }
  if (name === 'getProgressForCourse' && r) {
    const c = (r as { completionPct?: number; courseTitle?: string }).completionPct;
    if (typeof c === 'number') {
      return `getProgressForCourse: ${c}% complete`;
    }
  }
  if (name === 'getMyProfile' && (payload as { result?: { role?: string } }).result?.role) {
    return `getMyProfile: ${(payload as { result: { role: string } }).result.role}`;
  }
  if (payload.ok === true) {
    return `${name}: success`;
  }
  return `${name}: done`;
}

export type RunCopilotParams = {
  systemInstruction: string;
  /**
   * Full thread including the latest user text turn. Role model/user alternation as Gemini expects.
   */
  priorContents: CopilotContent[];
  getAccessToken: () => string | null;
  router: Pick<Router, 'push' | 'replace'>;
};

/**
 * Runs: model → (optional tool loop) → final assistant text. Updates contents for the next app turn.
 */
export async function runCopilotTurn(params: RunCopilotParams): Promise<{
  assistantText: string;
  toolLog: ToolLogEntry[];
  /** Append to ref for the next call (replaces or extends priorContents). */
  finalContents: CopilotContent[];
}> {
  const { systemInstruction, priorContents, getAccessToken, router } = params;
  const toolLog: ToolLogEntry[] = [];
  let contents = priorContents;
  const pushLog = (name: string, payload: Record<string, unknown>, ok: boolean) => {
    toolLog.push({ name, ok, summary: summarizeResponse(name, payload) });
  };

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await oneGenerateRound(systemInstruction, contents);
    if (res.kind === 'error') {
      const fallbackText = toolLog.length ? buildToolFallbackReply(toolLog) : null;
      return {
        assistantText: fallbackText ?? `Something went wrong: ${res.error}`,
        toolLog,
        finalContents: contents,
      };
    }

    if (res.kind === 'text') {
      return {
        assistantText: res.text,
        toolLog,
        finalContents: [...contents, res.modelContent],
      };
    }

    const { name, args } = res.functionCall;
    contents = [...contents, res.modelContent];

    let toolPayload: Record<string, unknown>;

    if (CLIENT_ONLY_COPILOT_TOOLS.has(name)) {
      if (name === 'navigateTo') {
        const path = typeof args.path === 'string' ? args.path : '';
        // Replace the chatbot route with the destination so users immediately see the action.
        const nav = runCopilotNavigateTo(path, (href) => router.replace(href));
        toolPayload = nav;
        const ok = Boolean(nav.navigated) && !nav.error;
        pushLog(name, toolPayload, ok);
      } else {
        const out = await runCopilotSignOut();
        toolPayload = out;
        pushLog(name, out, Boolean(out.signedOut) && !out.error);
      }
    } else {
      const token = getAccessToken();
      if (!token) {
        toolPayload = { ok: false, error: 'Not signed in. Please sign in to load account data or enrol.' };
        pushLog(name, toolPayload, false);
      } else {
        const raw = await invokeCopilotTool(token, name, args);
        toolPayload = raw;
        pushLog(name, raw, raw.ok === true);
      }
    }

    const functionResponse: CopilotContent = {
      role: 'user',
      parts: [
        {
          functionResponse: {
            name,
            response: toolPayload,
          },
        },
      ],
    };
    contents = [...contents, functionResponse];
  }

  return {
    assistantText: 'This request used too many steps. Please try a simpler question.',
    toolLog,
    finalContents: contents,
  };
}

/**
 * Re-export declarations for unit tests or UI hints.
 */
export { COPILOT_FUNCTION_DECLARATIONS };
