/**
 * @fileoverview Parse and validate lesson video_url (YouTube) for storage.
 */

function isYouTubeHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === 'youtu.be' ||
    h === 'www.youtu.be' ||
    h === 'youtube.com' ||
    h === 'm.youtube.com' ||
    h === 'www.youtube.com' ||
    h.endsWith('.youtube.com')
  );
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts the 11-char YouTube video id from a page URL, for the in-app player.
 */
export function getYouTubeVideoId(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  let u: URL;
  try {
    u = new URL(withProto);
  } catch {
    return null;
  }
  if ((u.protocol !== 'http:' && u.protocol !== 'https:') || !isYouTubeHost(u.hostname)) {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const id = u.pathname.split('/').filter(Boolean)[0];
    return id && VIDEO_ID.test(id) ? id : null;
  }
  const v = u.searchParams.get('v');
  if (v && VIDEO_ID.test(v)) {
    return v;
  }
  for (const prefix of ['embed', 'v', 'shorts', 'live'] as const) {
    const parts = u.pathname.split('/').filter(Boolean);
    const i = parts.indexOf(prefix);
    if (i >= 0 && parts[i + 1] && VIDEO_ID.test(parts[i + 1]!)) {
      return parts[i + 1]!;
    }
  }
  return null;
}

/**
 * @returns Normalized https URL, or null if empty. Sets error if non-empty but invalid.
 */
export function parseLessonVideoUrlInput(raw: string): { value: string | null; error?: string } {
  const t = raw.trim();
  if (!t) {
    return { value: null };
  }
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  let u: URL;
  try {
    u = new URL(withProto);
  } catch {
    return { value: null, error: 'Enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...).' };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { value: null, error: 'Use an http or https link.' };
  }
  if (!isYouTubeHost(u.hostname)) {
    return { value: null, error: 'Use a YouTube link (youtube.com, m.youtube.com, or youtu.be).' };
  }
  return { value: u.toString() };
}
