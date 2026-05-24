/**
 * @fileoverview Admin settings — luxury emerald & gold theme
 */

import { signOut } from '@/services/authService';
import { updateProfile } from '@/services/profileService';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'expo-router';
import { LogOut, Shield, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';
const DARK = '#022418';

export default function AdminSettingsScreen() {
  const { profile, logout, setProfile } = useAuthStore();
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [language, setLanguage] = useState(profile?.language ?? 'en');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
          signOut().catch((error) => {
            console.error('[admin.settings] signOut failed:', error);
          });
        },
      },
    ]);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
            Console
          </Text>
          <Text style={{ color: DARK, fontSize: 28, fontWeight: '300', fontFamily: 'serif' }}>
            Settings
          </Text>
        </View>

        {/* Profile Hero */}
        <View style={{
          backgroundColor: EMERALD,
          marginHorizontal: 20,
          borderRadius: 20,
          padding: 24,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: `${GOLD}40`,
          marginBottom: 24,
        }}>
          <View style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: `${GOLD}30`,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: GOLD,
            marginBottom: 12,
          }}>
            <Shield size={32} color={GOLD} />
          </View>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '300', fontFamily: 'serif', marginBottom: 4 }}>
            {profile?.first_name} {profile?.last_name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={12} color={GOLD} />
            <Text style={{ color: GOLD, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>
              Principal Admin
            </Text>
          </View>
        </View>

        {/* Profile Form */}
        <View style={{
          backgroundColor: 'white',
          marginHorizontal: 20,
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: '#E8DFD0',
          marginBottom: 16,
        }}>
          <Text style={{ color: DARK, fontSize: 16, fontWeight: '600', fontFamily: 'serif', marginBottom: 20 }}>
            Personal Information
          </Text>

          {[
            { label: 'First Name', value: firstName, setter: setFirstName, placeholder: 'First name' },
            { label: 'Last Name', value: lastName, setter: setLastName, placeholder: 'Last name' },
            { label: 'Language', value: language, setter: setLanguage, placeholder: 'en' },
          ].map((field) => (
            <View key={field.label} style={{ marginBottom: 16 }}>
              <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600', marginBottom: 6 }}>
                {field.label}
              </Text>
              <TextInput
                value={field.value}
                onChangeText={field.setter}
                placeholder={field.placeholder}
                placeholderTextColor="#C4B89A"
                style={{
                  backgroundColor: CREAM,
                  borderWidth: 1,
                  borderColor: '#E8DFD0',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: DARK,
                }}
              />
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: isSaving ? `${EMERALD}80` : EMERALD,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 4,
              borderWidth: 1,
              borderColor: `${GOLD}40`,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ color: GOLD, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 }}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Academy Info */}
        <View style={{
          backgroundColor: 'white',
          marginHorizontal: 20,
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: '#E8DFD0',
          marginBottom: 16,
        }}>
          <Text style={{ color: DARK, fontSize: 16, fontWeight: '600', fontFamily: 'serif', marginBottom: 16 }}>
            Academy Information
          </Text>
          {[
            { label: 'Platform', value: 'Imbewu Academy' },
            { label: 'Region', value: 'South Africa' },
            { label: 'Version', value: '1.0.0' },
          ].map((item) => (
            <View key={item.label} style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#F0EAE0',
            }}>
              <Text style={{ color: '#8B7355', fontSize: 13 }}>{item.label}</Text>
              <Text style={{ color: DARK, fontSize: 13, fontWeight: '600' }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            marginHorizontal: 20,
            marginBottom: 40,
            backgroundColor: '#fff1f2',
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderWidth: 1,
            borderColor: '#fecdd3',
          }}
          activeOpacity={0.85}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 15 }}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
