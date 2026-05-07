/**
 * @fileoverview Coordinator certificate recipients list
 */

import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { getCoordinatorCertificateRecipients } from '@/services/supabase';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Award } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';

function formatCompletedDate(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function CoordinatorCertificatesScreen() {
  const { user } = useAuthStore();
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['coordinator-certificate-recipients', user?.id],
    queryFn: () => (user?.id ? getCoordinatorCertificateRecipients(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
  });

  useRefetchOnFocus(refetch, !!user?.id);

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-earth-900">Certificates</Text>
        <Text className="text-earth-600">Students who completed courses</Text>
      </View>

      <ScrollView className="flex-1 px-5">
        {isLoading ? (
          <View className="py-6">
            <Text className="text-earth-500">Loading certificates...</Text>
          </View>
        ) : data.length === 0 ? (
          <View className="py-6">
            <Text className="text-earth-500">No course certificates yet.</Text>
          </View>
        ) : (
          <View className="border-t border-earth-400/30">
            {data.map((item, index) => (
              <View
                key={item.id}
                className={`py-4 ${index < data.length - 1 ? 'border-b border-earth-300/50' : ''}`}
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-lg bg-primary-100 items-center justify-center mr-3">
                    <Award size={18} color="#16a34a" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-earth-900 font-semibold">{item.student_name}</Text>
                    <Text className="text-earth-700 mt-0.5">{item.course_title}</Text>
                    <Text className="text-earth-500 text-xs mt-1">Completed {formatCompletedDate(item.completed_at)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
