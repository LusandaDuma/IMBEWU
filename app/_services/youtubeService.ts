/**
 * @fileoverview YouTube Data API v3 — search for a relevant lesson video.
 *
 * Setup:
 *  1. Go to https://console.cloud.google.com
 *  2. Enable "YouTube Data API v3"
 *  3. Create an API key (restrict to YouTube Data API)
 *  4. Add to your env file: EXPO_PUBLIC_YOUTUBE_API_KEY=your_key_here
 */

const YT_API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '';

export type YouTubeVideoResult = {
  videoId: string;
  title: string;
  url: string;
};

/**
 * Searches YouTube and returns the best matching video URL for a lesson.
 * Returns null if the API key is missing, quota is exhausted, or no results found.
 *
 * @param lessonTitle  - e.g. "Theory & Botany of Tomatoes"
 * @param cropCategory - e.g. "Vegetables" — used to improve search relevance
 */
export async function fetchLessonVideo(
  lessonTitle: string,
  cropCategory: string
): Promise<YouTubeVideoResult | null> {
  if (!YT_API_KEY.trim()) {
    console.warn('[YouTube] EXPO_PUBLIC_YOUTUBE_API_KEY is not set — skipping video fetch.');
    return null;
  }

  // Build a focused search query
  const query = `${lessonTitle} ${cropCategory} farming South Africa tutorial`;

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: '3',
    relevanceLanguage: 'en',
    videoDuration: 'medium',    // 4–20 min — avoids shorts and hour-long lectures
    videoEmbeddable: 'true',    // must be embeddable in the app
    safeSearch: 'strict',
    key: YT_API_KEY,
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    );

    if (!res.ok) {
      const err = (await res.json()) as { error?: { message?: string } };
      console.warn('[YouTube] Search failed:', err.error?.message ?? res.status);
      return null;
    }

    const data = (await res.json()) as {
      items?: {
        id?: { videoId?: string };
        snippet?: { title?: string };
      }[];
    };

    const item = data.items?.find((i) => i.id?.videoId);
    if (!item?.id?.videoId) return null;

    const videoId = item.id.videoId;
    return {
      videoId,
      title: item.snippet?.title ?? lessonTitle,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (e) {
    console.warn('[YouTube] Network error during video fetch:', e);
    return null;
  }
}
