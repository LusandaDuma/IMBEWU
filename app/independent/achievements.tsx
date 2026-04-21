/**
 * @fileoverview Independent learner progress screen
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Award, BookOpen, Clock, Flame, Target } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';

const stats = [
  { label: 'Hours Learned', value: '24', icon: Clock, color: '#0891b2' },
  { label: 'Courses', value: '3', icon: BookOpen, color: '#16a34a' },
  { label: 'Day Streak', value: '12', icon: Flame, color: '#ea580c' },
];

const achievements = [
  { id: '1', name: 'First Steps', description: 'Complete your first lesson', icon: Target, unlocked: true },
  { id: '2', name: 'Dedicated Learner', description: 'Learn for 7 days straight', icon: Flame, unlocked: true },
  { id: '3', name: 'Course Master', description: 'Complete your first course', icon: Award, unlocked: false },
];

export default function ProgressScreen() {
  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-white">Your Progress</Text>
        <Text className="text-slate-400 mt-1">Track your achievements</Text>
      </View>

      <ScrollView className="flex-1 px-5">
        <View className="flex-row justify-between mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} className="flex-1 mx-1 bg-white rounded-2xl p-4 shadow-sm">
                <View 
                  className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon size={20} color={stat.color} />
                </View>
                <Text className="text-2xl font-bold text-earth-800">{stat.value}</Text>
                <Text className="text-earth-500 text-xs">{stat.label}</Text>
              </View>
            );
          })}
        </View>

        <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <Text className="text-lg font-bold text-earth-800 mb-4">Weekly Activity</Text>
          <View className="flex-row items-end justify-between h-24">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <View key={day + index} className="items-center">
                <View 
                  className="w-8 bg-cyan-200 rounded-t-lg"
                  style={{ height: Math.random() * 60 + 20 }}
                />
                <Text className="text-earth-500 text-xs mt-2">{day}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text className="text-lg font-bold text-earth-800 mb-3">Achievements</Text>
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
              <View className="w-12 h-12 rounded-xl bg-cyan-100 items-center justify-center">
                <Icon size={24} color="#0891b2" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="font-semibold text-earth-800">{achievement.name}</Text>
                <Text className="text-earth-500 text-sm">{achievement.description}</Text>
              </View>
              {achievement.unlocked && (
                <View className="bg-green-100 px-2 py-1 rounded-full">
                  <Text className="text-green-700 text-xs font-medium">Unlocked</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}
