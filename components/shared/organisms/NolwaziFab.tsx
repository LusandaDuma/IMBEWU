/**
 * @fileoverview Global floating action button to open Nolwazi from anywhere.
 * Sits above the bottom tab bar (role areas) and above the home indicator elsewhere.
 */

import { getNolwaziFabBottomOffset, isRoleTabPathname } from '@/constants/theme';
import { usePathname, useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAB_H = 56;
const RIGHT = 20;

export function NolwaziFab() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const hasTabBar = isRoleTabPathname(pathname);
  const bottom = getNolwaziFabBottomOffset(insets, hasTabBar);

  if (pathname?.startsWith('/nolwazi')) {
    return null;
  }

  return (
    <View
      style={[styles.fabContainer, { right: RIGHT, bottom }, styles.pointerEventsBoxNone]}
    >
      <TouchableOpacity
        onPress={() => router.push('/nolwazi')}
        style={styles.fabButton}
        accessibilityRole="button"
        accessibilityLabel="Open Nolwazi chatbot"
        activeOpacity={0.9}
      >
        <MessageCircle size={26} color="#ffffff" strokeWidth={1.8} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    zIndex: 50,
    elevation: 12,
  },
  pointerEventsBoxNone: {
    pointerEvents: 'box-none',
  },
  fabButton: {
    width: FAB_H,
    height: FAB_H,
    borderRadius: FAB_H / 2,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
});
