/**
 * @fileoverview Nolwazi — AgroLearn / Imbewu LMS AI guide (Gemini).
 */

import { Input } from '@/components/shared';
import { NOLWAZI_SYSTEM_INSTRUCTION } from '@/constants/nolwaziKnowledge';
import { generateGeminiReply, type GeminiContent } from '@/services/gemini';
import { useAuthStore } from '@/store/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, SendHorizontal, Sparkles } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Msg = { id: string; role: 'user' | 'assistant'; text: string };

function getGreeting(name?: string | null): string {
  if (name?.trim()) {
    return `I'm Nolwazi 🌱
Welcome back, ${name}. What would you like to grow today?`;
  }

  return `I'm Nolwazi 🌱
What would you like to grow today?`;
}

/** Build API history; skip local welcome bubble so the first API turn is never `model`. */
function toHistory(messages: Msg[]): GeminiContent[] {
  const out: GeminiContent[] = [];
  for (const m of messages) {
    if (m.id === 'welcome') continue;
    if (m.role === 'user') {
      out.push({ role: 'user', parts: [{ text: m.text }] });
    } else {
      out.push({ role: 'model', parts: [{ text: m.text }] });
    }
  }
  return out;
}

export default function NolwaziScreen() {
  const router = useRouter();
  const { profile, role, isAuthenticated } = useAuthStore();
  const userFirstName = profile?.first_name ?? null;
  const userLastName = profile?.last_name ?? null;
  const displayName = [userFirstName, userLastName].filter(Boolean).join(' ').trim() || userFirstName;
  const personalizedSystemInstruction = useMemo(() => {
    const userContext = [
      'CURRENT USER CONTEXT',
      `- isAuthenticated: ${isAuthenticated ? 'true' : 'false'}`,
      `- role: ${role ?? 'guest'}`,
      `- firstName: ${userFirstName ?? 'unknown'}`,
      `- lastName: ${userLastName ?? 'unknown'}`,
      `- displayName: ${displayName ?? 'unknown'}`,
      '- If the user asks who they are or asks for personalized guidance, use this context.',
      '- Greet them by first name naturally when appropriate.',
    ].join('\n');

    return `${NOLWAZI_SYSTEM_INSTRUCTION}\n\n${userContext}`;
  }, [displayName, isAuthenticated, role, userFirstName, userLastName]);
  const listRef = useRef<FlatList<Msg>>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: getGreeting(displayName),
    },
  ]);
  const [sending, setSending] = useState(false);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setInput('');
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    const prior = toHistory(messages);
    const result = await generateGeminiReply({
      systemInstruction: personalizedSystemInstruction,
      history: prior,
      userMessage: trimmed,
    });

    setSending(false);

    if (!result.ok) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: `Something went wrong: ${result.error}`,
        },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: `a-${Date.now()}`, role: 'assistant', text: result.text },
    ]);
  }, [input, messages, personalizedSystemInstruction, sending]);

  return (
    <LinearGradient colors={['#D6D6D6', '#D6D6D6']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View className="px-5 pt-2 pb-3 flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-earth-300 items-center justify-center active:bg-earth-400"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={20} color="#1c1917" />
            </TouchableOpacity>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Sparkles size={18} color="#15803d" />
                <Text className="text-xl font-light text-black tracking-tight">Nolwazi</Text>
              </View>
              <Text className="text-earth-700 text-xs mt-0.5 font-light">
                AgroLearn guide — mother of knowledge
              </Text>
            </View>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, flexGrow: 1 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View
                className={`max-w-[90%] mb-3 px-4 py-3 rounded-3xl ${
                  item.role === 'user'
                    ? 'self-end bg-primary-600'
                    : 'self-start bg-earth-300'
                }`}
              >
                <Text
                  className={`text-sm leading-5 font-light ${
                    item.role === 'user' ? 'text-white' : 'text-black'
                  }`}
                >
                  {item.text}
                </Text>
              </View>
            )}
          />

          <View className="px-5 pb-4 pt-2 gap-2">
            {sending ? (
              <View className="flex-row items-center gap-2 px-1">
                <ActivityIndicator color="#16a34a" />
                <Text className="text-earth-700 text-xs font-light">Nolwazi is thinking…</Text>
              </View>
            ) : null}
            <View className="flex-row items-end gap-2">
              <View className="flex-1 rounded-3xl bg-earth-300 px-4 py-2">
                <Input
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask Nolwazi…"
                  placeholderTextColor="#78716c"
                  multiline
                  className="text-black min-h-[44px] max-h-28 py-2"
                  editable={!sending}
                />
              </View>
              <TouchableOpacity
                onPress={send}
                disabled={sending || !input.trim()}
                className="h-12 w-12 rounded-full bg-primary-600 items-center justify-center active:opacity-90 disabled:opacity-40"
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <SendHorizontal size={22} color="#ffffff" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
