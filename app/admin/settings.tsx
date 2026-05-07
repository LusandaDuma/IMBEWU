/**
 * @fileoverview Admin settings screen
 */

import { signOut } from '@/services/authService';
import { updateProfile } from '@/services/profileService';
import { useAuthStore } from '@/store/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { LogOut, Shield } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminSettingsScreen() {
  const { profile, logout, setProfile } = useAuthStore();
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [language, setLanguage] = useState(profile?.language ?? 'en');
  const [isSaving, setIsSaving] = useState(false);

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
              console.error('[admin.settings] signOut failed after local logout:', error);
            });
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!profile?.id) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing information', 'First name and last name are required.');
      return;
    }
    setIsSaving(true);
    const result = await updateProfile({
      id: profile.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      language: language.trim() || 'en',
    });
    setIsSaving(false);
    if (result.error || !result.data) {
      Alert.alert('Update failed', result.error ?? 'Unable to update your profile.');
      return;
    }
    setProfile(result.data);
    Alert.alert('Saved', 'Your information was updated.');
  };

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-1">
      <View className="pt-14 px-5 pb-4">
        <Text className="text-2xl font-bold text-earth-900">Settings</Text>
        <Text className="text-earth-600 mt-1">Update your information</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="items-center py-8">
          <View className="w-24 h-24 rounded-full bg-primary-600 items-center justify-center mb-4">
            <Shield size={40} color="white" />
          </View>
          <Text className="text-xl font-bold text-earth-800">
            {profile?.first_name} {profile?.last_name}
          </Text>
          <Text className="text-earth-500 capitalize">Administrator</Text>
        </View>

        <View className="px-5">
          <View className="rounded-2xl bg-white border border-earth-300/50 p-4">
            <Text className="text-earth-700 text-xs mb-2">First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              className="bg-earth-50 border border-earth-200 rounded-xl px-3 py-3 text-earth-900 mb-3"
              placeholder="First name"
              placeholderTextColor="#a8a29e"
            />
            <Text className="text-earth-700 text-xs mb-2">Last name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              className="bg-earth-50 border border-earth-200 rounded-xl px-3 py-3 text-earth-900 mb-3"
              placeholder="Last name"
              placeholderTextColor="#a8a29e"
            />
            <Text className="text-earth-700 text-xs mb-2">Language</Text>
            <TextInput
              value={language}
              onChangeText={setLanguage}
              className="bg-earth-50 border border-earth-200 rounded-xl px-3 py-3 text-earth-900"
              placeholder="en"
              placeholderTextColor="#a8a29e"
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className={`mt-4 rounded-xl px-4 py-3 items-center ${isSaving ? 'bg-primary-400' : 'bg-primary-600'}`}
            >
              <Text className="text-white font-semibold">{isSaving ? 'Saving...' : 'Save changes'}</Text>
            </TouchableOpacity>
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
