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
    result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
  });
}

function createBadgeFileName(learnerName: string, courseTitle?: string): string {
  const safeName = learnerName.trim().replace(/\s+/g, '-').toLowerCase() || 'learner';
  const safeCourse = courseTitle?.trim().replace(/\s+/g, '-').toLowerCase();
  const courseSegment = safeCourse ? `-${safeCourse}` : '';
  return `imbewu-course-badge-${safeName}${courseSegment}-${getFileStamp()}.png`;
}

export async function downloadBadgeTemplate(
  ref: React.RefObject<View | null>,
  learnerName: string,
  courseTitle?: string
): Promise<string> {
  const tempUri = await captureBadge(ref);
  const fileName = createBadgeFileName(learnerName, courseTitle);

  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = tempUri;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return fileName;
  }

  const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!baseDir) {
    return tempUri;
  }
  const exportDir = `${baseDir}badges`;
  await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
  const targetUri = `${exportDir}/${fileName}`;
  await FileSystem.copyAsync({ from: tempUri, to: targetUri });
  return targetUri;
}

export async function downloadBadgeTemplates(
  badges: Array<{ ref: React.RefObject<View | null>; courseTitle?: string }>,
  learnerName: string
): Promise<string[]> {
  const downloads = await Promise.all(badges.map((badge) => downloadBadgeTemplate(badge.ref, learnerName, badge.courseTitle)));
  return downloads;
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
