import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';

export default function IndependentLearnScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1 items-center justify-center px-6">
      <Text className="text-2xl font-bold text-white mb-4">Learning Path</Text>
      <Text className="text-slate-300 text-center mb-6">
        This is the independent learning hub. Select a course from the Explore tab to begin.
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/independent/explore')}
        className="rounded-2xl bg-primary-600 px-6 py-3 shadow-lg shadow-primary-600/50"
      >
        <Text className="text-white font-semibold">Browse Courses</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}
