/**
 * @fileoverview Independent learner profile screen
 */

import { signOut } from '@/services/authService';
import { useAuthStore } from '@/store/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, LogOut, Mail, Settings, User } from 'lucide-react-native';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function IndependentProfileScreen() {
  const { profile, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
            signOut().catch((error) => {
              console.error('[independent.profile] signOut failed after local logout:', error);
            });
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: User, label: 'Edit Profile', onPress: () => {} },
    { icon: Settings, label: 'Preferences', onPress: () => {} },
    { icon: Mail, label: 'Notifications', onPress: () => {} },
  ];

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-earth-900">Profile</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="items-center py-8">
          <View className="w-24 h-24 rounded-full bg-primary-600 items-center justify-center mb-4">
            <Text className="text-3xl font-bold text-white">
              {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
            </Text>
          </View>
          <Text className="text-xl font-bold text-earth-800">
            {profile?.first_name} {profile?.last_name}
          </Text>
          <Text className="text-earth-500 capitalize">{profile?.role} Learner</Text>
        </View>

        <View className="px-5">
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  className={`flex-row items-center px-4 py-4 ${
                    index < menuItems.length - 1 ? 'border-b border-earth-100' : ''
                  }`}
                >
                  <Icon size={20} color="#0891b2" />
                  <Text className="flex-1 ml-3 text-earth-800">{item.label}</Text>
                  <ChevronRight size={20} color="#a8a29e" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="px-5 mt-6">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center bg-red-50 rounded-xl px-4 py-4"
          >
            <LogOut size={20} color="#dc2626" />
            <Text className="flex-1 ml-3 text-red-600 font-medium">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}