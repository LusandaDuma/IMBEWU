import { BRAND_ICON, BRAND_NAME } from '@/constants/brandAssets';
import { Image, Text, View } from 'react-native';

export interface CompletionCertificateTemplateProps {
  learnerName: string;
  courseTitle?: string;
  awardedAt: string;
}

function formatDateLabel(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) {
    return value;
  }
  return dt.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function CompletionCertificateTemplate({ learnerName, courseTitle, awardedAt }: CompletionCertificateTemplateProps) {
  return (
    <View className="rounded-2xl border border-earth-300 bg-white px-5 py-5">
      <View className="items-center border-2 border-primary-200 rounded-xl px-4 py-6 bg-primary-50/20">
        <View className="flex-row items-center">
          <Image source={BRAND_ICON} style={{ width: 30, height: 30, marginRight: 8 }} resizeMode="contain" />
          <Image source={BRAND_NAME} style={{ width: 120, height: 30 }} resizeMode="contain" />
        </View>
        <Text className="mt-5 text-earth-700 text-xs tracking-wide">CERTIFICATE OF COMPLETION</Text>
        <Text className="mt-3 text-earth-900 text-xl font-semibold text-center">{learnerName}</Text>
        <Text className="mt-2 text-earth-700 text-center text-sm">has successfully completed the course</Text>
        <Text className="mt-2 text-primary-700 font-semibold text-center text-base">
          {courseTitle || 'Imbewu learning course'}
        </Text>
        <Text className="mt-5 text-earth-500 text-xs">Issued on {formatDateLabel(awardedAt)}</Text>
      </View>
    </View>
  );
}
