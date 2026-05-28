/**
 * @fileoverview Student profile — luxury theme with fixed sign out
 */

import { signOut } from '@/services/authService';
import { updateProfile } from '@/services/profileService';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'expo-router';
import { LogOut, Sprout, User } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

export default function StudentProfileScreen() {
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
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear local state first so UI redirects immediately
            logout();
            // Then call Supabase signout
            await signOut();
            // Force navigate to root which will redirect to login
            router.replace('/');
          } catch (e) {
            console.error('[student.profile] signOut error:', e);
            // Even if Supabase call fails, user is logged out locally
            router.replace('/');
          }
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
      language: language || 'en',
    });
    setIsSaving(false);
    if (result.error || !result.data) {
      Alert.alert('Update failed', result.error ?? 'Unable to update.');
      return;
    }
    setProfile(result.data);
    Alert.alert('Saved', 'Your information was updated.');
  };

  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase() || '?';
  const roleLabel = profile?.role === 'independent' ? 'Independent Grower' :
    profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Student';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.pageHeader}>
          <Text style={s.pageLabel}>Account</Text>
          <Text style={s.pageTitle}>My Profile</Text>
        </View>

        {/* Profile Hero */}
        <View style={s.heroCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.heroName}>{profile?.first_name} {profile?.last_name}</Text>
          <View style={s.roleBadge}>
            <Sprout size={12} color={GOLD} />
            <Text style={s.roleText}>{roleLabel}</Text>
          </View>
        </View>

        {/* Personal Info Form */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <User size={16} color={GOLD} />
            <Text style={s.cardTitle}>Personal Information</Text>
          </View>

          <View style={s.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>FIRST NAME</Text>
              <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#C4B89A" style={s.input} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>LAST NAME</Text>
              <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#C4B89A" style={s.input} />
            </View>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>LANGUAGE</Text>
            <View style={s.langRow}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => setLanguage(lang.code)}
                  style={[s.langBtn, language === lang.code && s.langBtnActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[s.langBtnText, language === lang.code && s.langBtnTextActive]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={[s.saveBtn, isSaving && { opacity: 0.7 }]}
            activeOpacity={0.85}
          >
            <Text style={s.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={[s.card, { marginTop: 12 }]}>
          <Text style={s.cardTitle2}>About</Text>
          {[
            { label: 'Platform', value: 'Imbewu Academy' },
            { label: 'Region', value: 'South Africa' },
            { label: 'Version', value: '1.0.0' },
          ].map((item) => (
            <View key={item.label} style={s.metaRow}>
              <Text style={s.metaLabel}>{item.label}</Text>
              <Text style={s.metaValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity onPress={handleLogout} style={s.signOutBtn} activeOpacity={0.85}>
          <LogOut size={20} color="#ef4444" />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CREAM },
  pageHeader: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  pageLabel: { color: '#8B7355', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  pageTitle: { color: DARK, fontSize: 28, fontWeight: '300', fontFamily: 'serif' },
  heroCard: { backgroundColor: EMERALD, marginHorizontal: 20, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: `${GOLD}40`, marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${GOLD}30`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GOLD, marginBottom: 12 },
  avatarText: { color: GOLD, fontWeight: '700', fontSize: 28 },
  heroName: { color: 'white', fontSize: 20, fontWeight: '300', fontFamily: 'serif', marginBottom: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleText: { color: GOLD, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
  card: { backgroundColor: 'white', marginHorizontal: 20, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E8DFD0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0EAE0' },
  cardTitle: { color: DARK, fontSize: 16, fontWeight: '600', fontFamily: 'serif' },
  cardTitle2: { color: DARK, fontSize: 15, fontWeight: '600', fontFamily: 'serif', marginBottom: 12 },
  nameRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  fieldGroup: { marginBottom: 20 },
  label: { color: '#8B7355', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: CREAM, borderWidth: 1, borderColor: '#E8DFD0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: DARK },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: CREAM, borderWidth: 1, borderColor: '#E8DFD0' },
  langBtnActive: { backgroundColor: EMERALD, borderColor: EMERALD },
  langBtnText: { color: '#8B7355', fontSize: 12, fontWeight: '600' },
  langBtnTextActive: { color: GOLD },
  saveBtn: { backgroundColor: EMERALD, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: `${GOLD}40` },
  saveBtnText: { color: GOLD, fontWeight: '700', fontSize: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0EAE0' },
  metaLabel: { color: '#8B7355', fontSize: 13 },
  metaValue: { color: DARK, fontSize: 13, fontWeight: '600' },
  signOutBtn: { marginHorizontal: 20, marginTop: 12, marginBottom: 40, backgroundColor: '#fff1f2', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#fecdd3' },
  signOutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});
