/**
 * @fileoverview Student profile — luxury emerald & gold theme
 */

import { signOut } from '@/services/authService';
import { updateProfile } from '@/services/profileService';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'expo-router';
import { LogOut, Sprout, User } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERALD = '#032f20';
const DARK = '#022418';
const GOLD = '#C9A84C';
const CREAM = '#FAF7F2';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zu', label: 'Zulu' },
  { code: 'xh', label: 'Xhosa' },
  { code: 'af', label: 'Afrikaans' },
  { code: 'st', label: 'Sotho' },
];

export default function ProfileScreen() {
  const { profile, logout, setProfile } = useAuthStore();
  const router = useRouter();
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [language, setLanguage] = useState(profile?.language ?? 'en');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
          signOut().catch((e) => console.error('[student.profile] signOut failed:', e));
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
    const result = await updateProfile({ id: profile.id, firstName: firstName.trim(), lastName: lastName.trim(), language: language || 'en' });
    setIsSaving(false);
    if (result.error || !result.data) { Alert.alert('Update failed', result.error ?? 'Unable to update.'); return; }
    setProfile(result.data);
    Alert.alert('Saved', 'Your information was updated.');
  };

  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase() || '?';
  const roleLabel = profile?.role === 'independent' ? 'Independent Grower' : profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Student';

  const inputStyle = {
    backgroundColor: CREAM, borderWidth: 1, borderColor: '#E8DFD0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: DARK,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CREAM }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 }}>
            Account
          </Text>
          <Text style={{ color: DARK, fontSize: 28, fontWeight: '300', fontFamily: 'serif' }}>
            My Profile
          </Text>
        </View>

        {/* Profile Hero */}
        <View style={{
          backgroundColor: EMERALD, marginHorizontal: 20, borderRadius: 20,
          padding: 24, alignItems: 'center', borderWidth: 1, borderColor: `${GOLD}40`, marginBottom: 20,
        }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: `${GOLD}30`, alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: GOLD, marginBottom: 12,
          }}>
            <Text style={{ color: GOLD, fontWeight: '700', fontSize: 28 }}>{initials}</Text>
          </View>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '300', fontFamily: 'serif', marginBottom: 4 }}>
            {profile?.first_name} {profile?.last_name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sprout size={12} color={GOLD} />
            <Text style={{ color: GOLD, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>
              {roleLabel}
            </Text>
          </View>
        </View>

        {/* Personal Info Form */}
        <View style={{
          backgroundColor: 'white', marginHorizontal: 20, borderRadius: 20,
          padding: 20, borderWidth: 1, borderColor: '#E8DFD0', marginBottom: 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0EAE0' }}>
            <User size={16} color={GOLD} />
            <Text style={{ color: DARK, fontSize: 16, fontWeight: '600', fontFamily: 'serif' }}>Personal Information</Text>
          </View>

          {/* Name Row */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 }}>First Name</Text>
              <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#C4B89A" style={inputStyle} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 }}>Last Name</Text>
              <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#C4B89A" style={inputStyle} />
            </View>
          </View>

          {/* Language */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#8B7355', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 }}>Language</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => setLanguage(lang.code)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: language === lang.code ? EMERALD : CREAM,
                    borderWidth: 1, borderColor: language === lang.code ? EMERALD : '#E8DFD0',
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: language === lang.code ? GOLD : '#8B7355', fontSize: 12, fontWeight: '600' }}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: isSaving ? `${EMERALD}80` : EMERALD,
              borderRadius: 12, paddingVertical: 14, alignItems: 'center',
              borderWidth: 1, borderColor: `${GOLD}40`,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ color: GOLD, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 }}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={{
          backgroundColor: 'white', marginHorizontal: 20, borderRadius: 20,
          padding: 20, borderWidth: 1, borderColor: '#E8DFD0', marginBottom: 16,
        }}>
          <Text style={{ color: DARK, fontSize: 15, fontWeight: '600', fontFamily: 'serif', marginBottom: 12 }}>About</Text>
          {[
            { label: 'Platform', value: 'Imbewu Academy' },
            { label: 'Region', value: 'South Africa' },
            { label: 'Version', value: '1.0.0' },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0EAE0' }}>
              <Text style={{ color: '#8B7355', fontSize: 13 }}>{item.label}</Text>
              <Text style={{ color: DARK, fontSize: 13, fontWeight: '600' }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            marginHorizontal: 20, marginBottom: 40, backgroundColor: '#fff1f2',
            borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
            flexDirection: 'row', alignItems: 'center', gap: 12,
            borderWidth: 1, borderColor: '#fecdd3',
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
