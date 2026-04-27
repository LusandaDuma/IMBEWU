import { BRAND_ICON, BRAND_NAME } from '@/constants/brandAssets';
import { Image, Text, View } from 'react-native';

export interface CompletionBadgeTemplateProps {
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

export function CompletionBadgeTemplate({ learnerName, courseTitle, awardedAt }: CompletionBadgeTemplateProps) {
  return (
    <View className="rounded-2xl border border-primary-200 bg-white px-5 py-5">
      <View className="items-center border border-primary-100 rounded-xl px-4 py-5">
        <View className="flex-row items-center">
          <Image source={BRAND_ICON} style={{ width: 30, height: 30, marginRight: 8 }} resizeMode="contain" />
          <Image source={BRAND_NAME} style={{ width: 120, height: 30 }} resizeMode="contain" />
        </View>
        <Text className="mt-4 text-earth-700 text-xs tracking-wide">COURSE COMPLETION BADGE</Text>
        <Text className="mt-3 text-black text-xl font-semibold text-center">{learnerName}</Text>
        <Text className="mt-2 text-earth-700 text-center text-sm">
          has successfully completed
          {'\n'}
          <Text className="text-primary-700 font-semibold">{courseTitle || 'an Imbewu learning course'}</Text>
        </Text>
        <Text className="mt-4 text-earth-500 text-xs">Awarded {formatDateLabel(awardedAt)}</Text>
      </View>
    </View>
  );
}
