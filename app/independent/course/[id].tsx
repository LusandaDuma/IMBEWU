import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function IndependentCourseScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-2xl font-bold text-earth-800 mb-4">Course Details</Text>
      <TouchableOpacity
        onPress={() => router.back()}
        className="rounded-xl bg-cyan-600 px-5 py-3"
      >
        <Text className="text-white font-semibold">Back to Explore</Text>
      </TouchableOpacity>
    </View>
  );
}
