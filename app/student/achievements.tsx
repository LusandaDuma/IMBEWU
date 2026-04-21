/**
 * @fileoverview Student achievements screen
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Award, BookOpen, Star, Target, Zap } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';

const achievements = [
  { id: '1', name: 'First Steps', description: 'Complete your first lesson', icon: BookOpen, color: '#16a34a', unlocked: true },
  { id: '2', name: 'Quick Learner', description: 'Complete 5 lessons in a week', icon: Zap, color: '#d97706', unlocked: true },
  { id: '3', name: 'Course Master', description: 'Complete an entire course', icon: Star, color: '#7c3aed', unlocked: false },
  { id: '4', name: 'Goal Setter', description: 'Set your learning goals', icon: Target, color: '#dc2626', unlocked: false },
  { id: '5', name: 'Knowledge Seeker', description: 'Enroll in 3 courses', icon: Award, color: '#0891b2', unlocked: true },
];

export default function AchievementsScreen() {
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-white">Achievements</Text>
        <Text className="text-slate-400 mt-1">Your progress</Text>
      </View>

      <View className="px-5 mb-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-primary-600">{unlockedCount}</Text>
              <Text className="text-earth-500">Achievements Unlocked</Text>
            </View>
            <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center">
              <Award size={32} color="#16a34a" />
            </View>
          </View>
          <View className="h-2 bg-earth-100 rounded-full mt-4 overflow-hidden">
            <View 
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            />
          </View>
          <Text className="text-earth-500 text-sm mt-2">
            {Math.round((unlockedCount / achievements.length) * 100)}% complete
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5">
        <Text className="text-lg font-bold text-earth-800 mb-3">All Badges</Text>
        {achievements.map((achievement) => {
          const Icon = achievement.icon;
          return (
            <View
              key={achievement.id}
              className={`flex-row items-center bg-white rounded-xl p-4 mb-3 ${
                !achievement.unlocked ? 'opacity-50' : ''
              }`}
              style={{ elevation: 1 }}
            >
              <View 
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${achievement.color}20` }}
              >
                <Icon size={24} color={achievement.color} />
              </View>
              <View className="flex-1 ml-4">
                <Text className="font-semibold text-earth-800">{achievement.name}</Text>
                <Text className="text-earth-500 text-sm">{achievement.description}</Text>
              </View>
              {achievement.unlocked && (
                <View className="bg-primary-100 px-2 py-1 rounded-full">
                  <Text className="text-primary-700 text-xs font-medium">Unlocked</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}
