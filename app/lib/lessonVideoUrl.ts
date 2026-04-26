/**
 * @fileoverview Parse and validate lesson video_url (YouTube) for storage.
 */

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
  const host = u.hostname.toLowerCase();
  const isYouTube =
    host === 'youtu.be' ||
    host === 'www.youtu.be' ||
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'www.youtube.com' ||
    host.endsWith('.youtube.com');
  if (!isYouTube) {
    return { value: null, error: 'Use a YouTube link (youtube.com, m.youtube.com, or youtu.be).' };
  }
  return { value: u.toString() };
}
