/**
 * @fileoverview Embedded YouTube lesson video (in-app) with optional “open in browser” fallback.
 */

import { getYouTubeVideoId } from '@/lib/lessonVideoUrl';
import { useMemo, useState } from 'react';
import { useWindowDimensions, View, Text, Platform, Pressable } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Play } from 'lucide-react-native';
import { Button } from '../atoms/Button';

export type LessonVideoCalloutProps = {
  videoUrl: string | null | undefined;
  /** Button variant for student (primary) vs independent (accent), etc. */
  variant?: 'primary' | 'accent';
  testID?: string;
};

const H_PAD = 40;

export function LessonVideoCallout({ videoUrl, variant = 'primary', testID }: LessonVideoCalloutProps) {
  if (!videoUrl?.trim()) {
    return null;
  }
  const url = videoUrl.trim();
  const videoId = getYouTubeVideoId(url);
  const { width: windowW } = useWindowDimensions();
  const [embedFailed, setEmbedFailed] = useState(false);

  const { playerWidth, playerHeight } = useMemo(() => {
    const w = Math.min(windowW - H_PAD, 560);
    const h = Math.max(200, Math.round((w * 9) / 16));
    return { playerWidth: w, playerHeight: h };
  }, [windowW]);

  if (!videoId || embedFailed) {
    return (
      <View className="mb-6" testID={testID}>
        <Text className="text-xs font-medium text-earth-500 uppercase tracking-[0.2em] mb-2">Video</Text>
        <Text className="text-earth-600 text-sm font-light leading-5 mb-3">
          {embedFailed
            ? "We couldn’t play this video in the app. Open it in your browser instead."
            : 'Watch the lesson video, then read the notes below.'}
        </Text>
        <Button
          label="Open video in browser"
          onPress={() => {
            void WebBrowser.openBrowserAsync(url);
          }}
          variant={variant}
          size="md"
          fullWidth
          leftIcon={Play}
        />
      </View>
    );
  }

  return (
    <View className="mb-6" testID={testID}>
      <Text className="text-xs font-medium text-earth-500 uppercase tracking-[0.2em] mb-2">Video</Text>
      <Text className="text-earth-600 text-sm font-light leading-5 mb-3">
        Watch the lesson video below, or open it in your browser if you prefer.
      </Text>
      <View
        className="overflow-hidden rounded-xl bg-black"
        style={{ width: playerWidth, alignSelf: 'center' }}
      >
        <YoutubePlayer
          width={playerWidth}
          height={playerHeight}
          videoId={videoId}
          play={false}
          onError={() => setEmbedFailed(true)}
          webViewStyle={Platform.OS === 'android' ? { opacity: 0.99 } : undefined}
          initialPlayerParams={{ controls: true }}
        />
      </View>
      <Pressable
        onPress={() => {
          void WebBrowser.openBrowserAsync(url);
        }}
        className="mt-2 py-2 self-center"
        accessibilityRole="link"
        accessibilityLabel="Open video in browser"
      >
        <Text className="text-earth-500 text-sm font-light underline">Open in browser</Text>
      </Pressable>
    </View>
  );
}
