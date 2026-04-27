import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform, Share, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

function getFileStamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
}

async function captureBadge(ref: React.RefObject<View | null>): Promise<string> {
  if (!ref.current) {
    throw new Error('Badge template is not ready yet. Please try again.');
  }

  return captureRef(ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });
}

export async function downloadBadgeTemplate(
  ref: React.RefObject<View | null>,
  learnerName: string
): Promise<string> {
  const tempUri = await captureBadge(ref);
  const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!baseDir) {
    return tempUri;
  }
  const exportDir = `${baseDir}badges`;
  await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
  const safeName = learnerName.trim().replace(/\s+/g, '-').toLowerCase() || 'learner';
  const targetUri = `${exportDir}/imbewu-course-badge-${safeName}-${getFileStamp()}.png`;
  await FileSystem.copyAsync({ from: tempUri, to: targetUri });
  return targetUri;
}

export async function shareBadgeTemplate(ref: React.RefObject<View | null>, learnerName: string): Promise<void> {
  const tempUri = await captureBadge(ref);
  if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(tempUri, {
      mimeType: 'image/png',
      dialogTitle: `Share ${learnerName}'s Imbewu badge`,
      UTI: 'public.png',
    });
    return;
  }

  await Share.share({
    message: 'I completed my Imbewu course badge.',
    url: tempUri,
  });
}
