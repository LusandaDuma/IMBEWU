/**
 * @fileoverview Global floating action button to open Nolwazi from anywhere.
 */

import { usePathname, useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { TouchableOpacity, View } from 'react-native';

export function NolwaziFab() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname?.startsWith('/nolwazi')) {
    return null;
  }

  return (
    <View className="absolute right-5 bottom-8 z-50">
      <TouchableOpacity
        onPress={() => router.push('/nolwazi')}
        className="w-14 h-14 rounded-full bg-primary-600 items-center justify-center shadow-2xl"
        accessibilityRole="button"
        accessibilityLabel="Open Nolwazi chatbot"
        activeOpacity={0.9}
      >
        <MessageCircle size={24} color="#ffffff" strokeWidth={1.8} />
      </TouchableOpacity>
    </View>
  );
}
