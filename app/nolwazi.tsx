/**
 * @fileoverview Nolwazi — AgroLearn / Imbewu LMS AI guide (Gemini).
 */

import { Input } from '@/components/shared';
import { NOLWAZI_SYSTEM_INSTRUCTION } from '@/constants/nolwaziKnowledge';
import { generateGeminiReply, type GeminiContent } from '@/services/gemini';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, SendHorizontal, Sparkles } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
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

const GREETING = `Why did the seed start learning? To grow smarter 😄
I'm Nolwazi 🌱
What would you like to grow today?`;

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
  const listRef = useRef<FlatList<Msg>>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: GREETING,
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
      systemInstruction: NOLWAZI_SYSTEM_INSTRUCTION,
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
  }, [input, messages, sending]);

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View className="px-5 pt-2 pb-3 flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center active:bg-white/15"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={20} color="#e2e8f0" />
            </TouchableOpacity>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Sparkles size={18} color="#86efac" />
                <Text className="text-xl font-light text-white tracking-tight">Nolwazi</Text>
              </View>
              <Text className="text-slate-400 text-xs mt-0.5 font-light">
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
                    ? 'self-end bg-primary-600/90'
                    : 'self-start bg-white/10'
                }`}
              >
                <Text
                  className={`text-sm leading-5 font-light ${
                    item.role === 'user' ? 'text-white' : 'text-slate-100'
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
                <ActivityIndicator color="#86efac" />
                <Text className="text-slate-500 text-xs font-light">Nolwazi is thinking…</Text>
              </View>
            ) : null}
            <View className="flex-row items-end gap-2">
              <View className="flex-1 rounded-3xl bg-white/10 px-4 py-2">
                <Input
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask Nolwazi…"
                  placeholderTextColor="#94a3b8"
                  multiline
                  className="text-white min-h-[44px] max-h-28 py-2"
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
