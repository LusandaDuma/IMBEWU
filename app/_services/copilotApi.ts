/**
 * @fileoverview Mediation API client — Nolwazi server tools (Supabase Edge Function only).
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export type CopilotMediationResponse =
  | { ok: true; tool: string; result: unknown }
  | { ok: false; tool?: string; error: string; code?: string };

/**
 * Invokes a registered server tool. Uses the user's JWT; never sends credentials in the body.
 */
export async function invokeCopilotTool(
  accessToken: string,
  tool: string,
  args: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, error: 'Supabase is not configured.' };
  }

  const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/copilot`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ tool, args }),
    });

    const data = (await res.json()) as CopilotMediationResponse;

    if (!res.ok) {
      if ('error' in data && typeof (data as { error?: string }).error === 'string') {
        return { ok: false, error: (data as { error: string }).error, httpStatus: res.status };
      }
      return { ok: false, error: `Request failed (${res.status})` };
    }

    if (data.ok === true) {
      return { ok: true, tool: data.tool, result: data.result };
    }
    return { ok: false, error: (data as { error: string }).error, tool: (data as { tool?: string }).tool };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error';
    return { ok: false, error: message };
  }
}
