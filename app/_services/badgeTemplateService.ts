import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert, Platform, Share, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

function getFileStamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-');
}

async function captureView(ref: React.RefObject<View | null>): Promise<string> {
  if (!ref.current) {
    throw new Error('Template is not ready yet. Please try again.');
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
  return `imbewu-badge-${safeName}${courseSegment}-${getFileStamp()}.png`;
}

function createCertificateFileName(learnerName: string, courseTitle?: string): string {
  const safeName = learnerName.trim().replace(/\s+/g, '-').toLowerCase() || 'learner';
  const safeCourse = courseTitle?.trim().replace(/\s+/g, '-').toLowerCase();
  const courseSegment = safeCourse ? `-${safeCourse}` : '';
  return `imbewu-certificate-${safeName}${courseSegment}-${getFileStamp()}.png`;
}

/**
 * Saves a captured image URI to the device's photo library.
 * Falls back to expo-sharing if media library permission is denied.
 * Returns 'saved', 'shared', or 'denied'.
 */
async function saveToLibrary(
  tempUri: string,
  fileName: string,
  shareDialogTitle: string
): Promise<'saved' | 'shared' | 'denied'> {
  const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();

  if (status === 'granted') {
    // Write to a named file first so the album entry has a clean name
    const dest = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.copyAsync({ from: tempUri, to: dest });
    await MediaLibrary.saveToLibraryAsync(dest);
    return 'saved';
  }

  // Permission denied — fall back to the share sheet so the user can
  // still save manually via the OS share menu
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(tempUri, {
      mimeType: 'image/png',
      dialogTitle: shareDialogTitle,
      UTI: 'public.png',
    });
    return 'shared';
  }

  return 'denied';
}

// ── Badges ────────────────────────────────────────────────────────────────────

export async function downloadBadgeTemplate(
  ref: React.RefObject<View | null>,
  learnerName: string,
  courseTitle?: string
): Promise<string> {
  const tempUri = await captureView(ref);
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

  const result = await saveToLibrary(tempUri, fileName, `Save ${learnerName}'s Imbewu badge`);
  if (result === 'saved') return 'Saved to your Photos.';
  if (result === 'shared') return 'Opened share sheet — save from there.';
  throw new Error('Photo library permission denied. Please enable it in Settings.');
}

export async function downloadBadgeTemplates(
  badges: { ref: React.RefObject<View | null>; courseTitle?: string }[],
  learnerName: string
): Promise<string[]> {
  return Promise.all(
    badges.map((badge) => downloadBadgeTemplate(badge.ref, learnerName, badge.courseTitle))
  );
}

export async function shareBadgeTemplate(
  ref: React.RefObject<View | null>,
  learnerName: string
): Promise<void> {
  const tempUri = await captureView(ref);

  if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(tempUri, {
      mimeType: 'image/png',
      dialogTitle: `Share ${learnerName}'s Imbewu badge`,
      UTI: 'public.png',
    });
    return;
  }

  await Share.share({
    message: "I completed my Imbewu course badge.",
    url: tempUri,
  });
}

// ── Certificates ──────────────────────────────────────────────────────────────

export async function downloadCertificateTemplate(
  ref: React.RefObject<View | null>,
  learnerName: string,
  courseTitle?: string
): Promise<string> {
  const tempUri = await captureView(ref);
  const fileName = createCertificateFileName(learnerName, courseTitle);

  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = tempUri;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return fileName;
  }

  const result = await saveToLibrary(tempUri, fileName, `Save ${learnerName}'s Imbewu certificate`);
  if (result === 'saved') return 'Saved to your Photos.';
  if (result === 'shared') return 'Opened share sheet — save from there.';
  throw new Error('Photo library permission denied. Please enable it in Settings.');
}

export async function downloadCertificateTemplates(
  certificates: { ref: React.RefObject<View | null>; courseTitle?: string }[],
  learnerName: string
): Promise<string[]> {
  return Promise.all(
    certificates.map((cert) =>
      downloadCertificateTemplate(cert.ref, learnerName, cert.courseTitle)
    )
  );
}

export async function shareCertificateTemplate(
  ref: React.RefObject<View | null>,
  learnerName: string
): Promise<void> {
  const tempUri = await captureView(ref);

  if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(tempUri, {
      mimeType: 'image/png',
      dialogTitle: `Share ${learnerName}'s Imbewu certificate`,
      UTI: 'public.png',
    });
    return;
  }

  await Share.share({
    message: "I completed my Imbewu course certificate.",
    url: tempUri,
  });
}
