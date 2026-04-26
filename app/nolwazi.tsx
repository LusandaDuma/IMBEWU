/**
 * @fileoverview Nolwazi — AgroLearn / Imbewu LMS AI copilot (Gemini + tools + mediation API).
 */

import { Input } from '@/components/shared';
import { NOLWAZI_SYSTEM_INSTRUCTION } from '@/constants/nolwaziKnowledge';
import { runCopilotTurn, type CopilotContent, type ToolLogEntry } from '@/services/geminiCopilot';
import { useAuthStore } from '@/store/auth';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, SendHorizontal, Sparkles, Wrench } from 'lucide-react-native';
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

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  toolLog?: ToolLogEntry[];
};

const COPILOT_ADDENDUM = `

COPILOT (REGISTERED TOOLS ONLY)
- Use only the provided function tools for account data, catalogue, progress, self-enrolment, or safe navigation. Do not claim you performed an action without a tool result.
- If the user is not signed in, say so and use navigateTo("/auth/login") or answer generally without inventing their data.`;

function getGreeting(name?: string | null): string {
  if (name?.trim()) {
    return `I'm Nolwazi 🌱
Welcome back, ${name}. What would you like to grow today?`;
  }

  return `I'm Nolwazi 🌱
What would you like to grow today?`;
}

export default function NolwaziScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, role, isAuthenticated, session } = useAuthStore();
  const userFirstName = profile?.first_name ?? null;
  const userLastName = profile?.last_name ?? null;
  const displayName = [userFirstName, userLastName].filter(Boolean).join(' ').trim() || userFirstName;

  const apiContentsRef = useRef<CopilotContent[]>([]);

  const personalizedSystemInstruction = useMemo(() => {
    const userContext = [
      'CURRENT USER CONTEXT',
      `- isAuthenticated: ${isAuthenticated ? 'true' : 'false'}`,
      `- role: ${role ?? 'guest'}`,
      `- firstName: ${userFirstName ?? 'unknown'}`,
      `- lastName: ${userLastName ?? 'unknown'}`,
      `- displayName: ${displayName ?? 'unknown'}`,
      '- If the user asks who they are, use this context. Greet with first name when natural.',
    ].join('\n');

    return `${NOLWAZI_SYSTEM_INSTRUCTION}${COPILOT_ADDENDUM}\n\n${userContext}`;
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
  const sendingRef = useRef(false);

  const getAccessToken = useCallback(
    () => session?.access_token ?? useAuthStore.getState().session?.access_token ?? null,
    [session?.access_token],
  );

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sendingRef.current) return;
    sendingRef.current = true;

    setInput('');
    setSending(true);

    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);

    const userContent: CopilotContent = { role: 'user', parts: [{ text: trimmed }] };
    const priorContents = [...apiContentsRef.current, userContent];

    try {
      const { assistantText, toolLog, finalContents } = await runCopilotTurn({
        systemInstruction: personalizedSystemInstruction,
        priorContents,
        getAccessToken,
        router,
      });

      // Always sync API thread (including failed turns where finalContents = prior only)
      apiContentsRef.current = finalContents;

      if (toolLog.some((t) => t.name === 'enrolIfEligible' && t.ok)) {
        void queryClient.invalidateQueries({ queryKey: ['student-enrolments'] });
        void queryClient.invalidateQueries({ queryKey: ['available-courses'] });
        void queryClient.invalidateQueries({ queryKey: ['courses', 'published'] });
        void queryClient.invalidateQueries({ queryKey: ['course'] });
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: assistantText,
          toolLog: toolLog.length > 0 ? toolLog : undefined,
        },
      ]);
    } catch (e) {
      apiContentsRef.current = priorContents;
      const message = e instanceof Error ? e.message : 'Unexpected error';
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: `Something went wrong: ${message}`,
        },
      ]);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [getAccessToken, input, personalizedSystemInstruction, queryClient, router]);

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
                AgroLearn copilot — tools & your data (when signed in)
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
                className={`max-w-[92%] mb-4 ${
                  item.role === 'user' ? 'self-end border-b-2 border-primary-600/70 pb-2' : 'self-start border-b border-earth-400/40 pb-2'
                }`}
              >
                <Text
                  className={`text-sm leading-5 font-light ${
                    item.role === 'user' ? 'text-earth-900 text-right' : 'text-earth-900'
                  }`}
                >
                  {item.text}
                </Text>
                {item.toolLog && item.toolLog.length > 0 ? (
                  <View className="mt-2.5 pl-0 pr-0 rounded-2xl bg-white/50 px-3 py-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <Wrench size={12} color="#57534e" />
                      <Text className="text-[11px] text-earth-600 font-medium tracking-wide">Actions</Text>
                    </View>
                    {item.toolLog.map((t, ti) => (
                      <Text
                        key={`${item.id}-tl-${ti}`}
                        className="text-[11px] text-earth-700 font-light leading-4 mb-0.5"
                      >
                        {t.ok ? '✓' : '—'} {t.summary}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            )}
          />

          <View className="px-5 pb-4 pt-2 gap-2">
            {sending ? (
              <View className="flex-row items-center gap-2 px-1">
                <ActivityIndicator color="#16a34a" />
                <Text className="text-earth-700 text-xs font-light">Nolwazi is working…</Text>
              </View>
            ) : null}
            <View className="flex-row items-end gap-2">
              <View className="flex-1 border-b border-earth-400/50 py-1">
                <Input
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask Nolwazi…"
                  placeholderTextColor="#78716c"
                  multiline
                  className="text-earth-900 min-h-[44px] max-h-28 py-2"
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
