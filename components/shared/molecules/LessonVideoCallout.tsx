/**
 * @fileoverview Opens lesson video (YouTube) in the in-app browser.
 */

import { Button } from '../atoms/Button';
import { Play } from 'lucide-react-native';
import { Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export type LessonVideoCalloutProps = {
  videoUrl: string | null | undefined;
  /** Button variant for student (primary) vs independent (accent), etc. */
  variant?: 'primary' | 'accent';
  testID?: string;
};

export function LessonVideoCallout({ videoUrl, variant = 'primary', testID }: LessonVideoCalloutProps) {
  if (!videoUrl?.trim()) {
    return null;
  }
  const url = videoUrl.trim();
  return (
    <View className="mb-6" testID={testID}>
      <Text className="text-xs font-medium text-earth-500 uppercase tracking-[0.2em] mb-2">Video</Text>
      <Text className="text-earth-600 text-sm font-light leading-5 mb-3">
        Watch the lesson video, then read the notes below.
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
