/**
 * @fileoverview OpenAI + Copilot: function calling and orchestration loop.
 * The model may only use declared tools; server tools hit the Edge mediation API; client tools stay in-app.
 */

import { invokeCopilotTool } from '@/services/copilotApi';
import { CLIENT_ONLY_COPILOT_TOOLS, runCopilotNavigateTo, runCopilotSignOut } from '@/services/copilotClientTools';
import { getOpenAiApiKey } from '@/services/openai';
import type { Router } from 'expo-router';

const DEFAULT_MODEL = 'gpt-4.1-mini';
const FALLBACK_MODELS = ['gpt-4.1-mini'] as const;
const MAX_TOOL_ROUNDS = 8;

function normalizeModelError(message: string): string {
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
  return `Nolwazi is temporarily busy due to API quota limits.${waitText}`;
}

/** Copilot content (tool-call compatible transcript). */
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

type OpenAiTool = {
  type: 'function';
  function: { name: string; description?: string; parameters: Record<string, unknown> };
};

type OpenAiChatMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }> }
  | { role: 'tool'; tool_call_id: string; content: string };

async function callOpenAiChat(params: {
  apiKey: string;
  model: string;
  messages: OpenAiChatMessage[];
  tools: OpenAiTool[];
}): Promise<
  | { ok: true; kind: 'text'; text: string; toolCall?: never; toolCallId?: never }
  | { ok: true; kind: 'tool'; toolCall: { name: string; args: Record<string, unknown> }; toolCallId: string; text?: never }
  | { ok: false; status: number; error: string }
> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      tools: params.tools,
      tool_choice: 'auto',
      temperature: 0.55,
      max_tokens: 768,
    }),
  });

  const json = (await res.json()) as any;
  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: json?.error?.message ?? `Request failed (${res.status})`,
    };
  }

  const message = json?.choices?.[0]?.message;
  const contentText = typeof message?.content === 'string' ? message.content.trim() : '';
  const toolCalls = Array.isArray(message?.tool_calls) ? message.tool_calls : [];

  if (toolCalls.length > 0) {
    const first = toolCalls[0];
    const name = String(first?.function?.name ?? '').trim();
    const argsRaw = String(first?.function?.arguments ?? '').trim();
    let args: Record<string, unknown> = {};
    try {
      args = argsRaw ? (JSON.parse(argsRaw) as Record<string, unknown>) : {};
    } catch {
      args = {};
    }
    return { ok: true, kind: 'tool', toolCall: { name, args: asRecord(args) }, toolCallId: String(first?.id ?? 'toolcall') };
  }

  if (contentText) {
    return { ok: true, kind: 'text', text: contentText };
  }

  return { ok: false, status: 500, error: 'Empty model output.' };
}

/**
 * One OpenAI round with function-calling config.
 */
async function oneGenerateRound(
  systemInstruction: string,
  contents: CopilotContent[],
  model: string = DEFAULT_MODEL,
): Promise<GenerateResult> {
  const key = getOpenAiApiKey();
  if (!key?.trim()) {
    return { kind: 'error', error: 'Missing EXPO_PUBLIC_OPENAI_API_KEY' };
  }

  // Convert Copilot transcript to OpenAI messages INCLUDING tool call + tool responses.
  // This prevents the model from repeatedly requesting the same tool due to missing tool outputs.
  const messages: OpenAiChatMessage[] = [{ role: 'system', content: systemInstruction }];
  let lastToolCallId: string | null = null;
  let toolCallCounter = 0;
  let lastToolCallMsgIndex: number | null = null;

  for (const c of contents) {
    const role = c.role === 'user' ? 'user' : 'assistant';

    for (const p of c.parts ?? []) {
      // Tool responses in the stored transcript are represented as `functionResponse` parts.
      // In the legacy Gemini format, these are stored as a "user" role message, so we must
      // convert them to OpenAI `tool` messages regardless of `c.role`.
      if (p.functionResponse?.name) {
        const toolId = lastToolCallId ?? `call_${toolCallCounter++}`;
        messages.push({
          role: 'tool',
          tool_call_id: toolId,
          content: JSON.stringify(p.functionResponse.response ?? {}),
        });
        lastToolCallId = null;
        lastToolCallMsgIndex = null;
        continue;
      }

      // Normal text
      if (p.text && p.text.trim()) {
        messages.push({ role, content: p.text.trim() });
      }

      // Tool call request (assistant side)
      if (p.functionCall?.name) {
        const id = `call_${toolCallCounter++}`;
        lastToolCallId = id;
        lastToolCallMsgIndex = messages.length;
        messages.push({
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id,
              type: 'function',
              function: {
                name: p.functionCall.name,
                arguments: JSON.stringify(asRecord(p.functionCall.args ?? {})),
              },
            },
          ],
        });
      }
    }
  }

  // OpenAI requires every assistant `tool_calls` in the request history to be followed
  // by tool messages for each `tool_call_id`. If we have a dangling tool call in the
  // persisted transcript (e.g. app crashed mid-round), drop it from the history.
  if (lastToolCallId && lastToolCallMsgIndex != null) {
    messages.splice(lastToolCallMsgIndex, 1);
  }

  const tools: OpenAiTool[] = COPILOT_FUNCTION_DECLARATIONS.map((d) => ({
    type: 'function',
    function: {
      name: d.name,
      description: d.description,
      parameters: d.parameters as Record<string, unknown>,
    },
  }));

  const modelsToTry = [model, ...FALLBACK_MODELS.filter((m) => m !== model)];

  let lastErr = 'Unknown';
  for (const m of modelsToTry) {
    const r = await callOpenAiChat({ apiKey: key, model: m, messages, tools });
    if (!r.ok) {
      lastErr = normalizeModelError(r.error);
      if (r.status === 429 || r.status === 503 || r.status === 404) {
        if (r.status === 429 && lastErr.includes('quota limits')) {
          return { kind: 'error', error: lastErr };
        }
        continue;
      }
      return { kind: 'error', error: normalizeModelError(r.error) };
    }

    if (r.kind === 'tool') {
      if (!COPILOT_FUNCTION_DECLARATIONS.some((d) => d.name === r.toolCall.name)) {
        return { kind: 'error', error: 'Model requested an unknown tool (blocked).' };
      }
      const modelContent: CopilotContent = { role: 'model', parts: [{ functionCall: { name: r.toolCall.name, args: r.toolCall.args } }] };
      return { kind: 'function', functionCall: r.toolCall, modelContent };
    }

    const modelContent: CopilotContent = { role: 'model', parts: [{ text: r.text }] };
    return { kind: 'text', text: r.text, modelContent };
  }

  return { kind: 'error', error: normalizeModelError(lastErr) };
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

