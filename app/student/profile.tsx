/**
 * @fileoverview Student profile screen
 */

import { surfaceMenuShell } from '@/constants/theme';
import { View, Text, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { User, Mail, LogOut, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth';
import { signOut } from '@/services/authService';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
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
              console.error('[student.profile] signOut failed after local logout:', error);
            });
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: User, label: 'Edit Profile', onPress: () => {} },
    { icon: Mail, label: 'Notifications', onPress: () => {} },
  ];

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
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
          <Text className="text-xl font-bold text-earth-900">
            {profile?.first_name} {profile?.last_name}
          </Text>
          <Text className="text-earth-500 capitalize">{profile?.role}</Text>
        </View>

        <View className="px-5">
          <View className={surfaceMenuShell}>
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
                  <Icon size={20} color="#16a34a" />
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

        <View className="items-center py-8">
          <Image
            source={require('../../assets/images/icon.png')}
            className="w-8 h-8"
            resizeMode="contain"
          />
          <Image
            source={require('../../assets/images/name.png')}
            className="w-24 h-6 mt-2"
            resizeMode="contain"
          />
          <Text className="text-earth-400 text-xs mt-1">v1.0</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
