/**
 * @fileoverview Coordinator analytics dashboard
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Award, BookOpen, TrendingUp, Users } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';

const stats = [
  { label: 'Total Students', value: '24', icon: Users, color: '#16a34a' },
  { label: 'Active Classes', value: '3', icon: BookOpen, color: '#d97706' },
  { label: 'Avg. Completion', value: '78%', icon: TrendingUp, color: '#0891b2' },
  { label: 'Certificates', value: '12', icon: Award, color: '#7c3aed' },
];

const recentActivity = [
  { id: '1', text: 'Sarah completed "Introduction to Farming"', time: '2 hours ago' },
  { id: '2', text: 'New student joined Class A', time: '4 hours ago' },
  { id: '3', text: 'Quiz completed: Crop Rotation Basics', time: '1 day ago' },
  { id: '4', text: '5 students completed this week', time: '2 days ago' },
];

export default function CoordinatorAnalyticsScreen() {
  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-white">Analytics</Text>
        <Text className="text-slate-400">Track your students' progress</Text>
      </View>

      <ScrollView className="flex-1 px-5">
        <View className="flex-row flex-wrap -mx-2">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} className="w-1/2 px-2 mb-4">
                <View className="bg-white rounded-2xl p-4 shadow-sm">
                  <View 
                    className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon size={20} color={stat.color} />
                  </View>
                  <Text className="text-2xl font-bold text-earth-800">{stat.value}</Text>
                  <Text className="text-earth-500 text-sm">{stat.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text className="text-lg font-bold text-earth-800 mt-4 mb-3">Recent Activity</Text>
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {recentActivity.map((activity, index) => (
            <View
              key={activity.id}
              className={`px-4 py-4 ${
                index < recentActivity.length - 1 ? 'border-b border-earth-100' : ''
              }`}
            >
              <Text className="text-earth-800">{activity.text}</Text>
              <Text className="text-earth-400 text-sm mt-1">{activity.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}