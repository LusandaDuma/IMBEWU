/**
 * @fileoverview Nolwazi — Imbewu Copilot UI
 * Design: dark-green header, white chat body, gold accents, pill badge.
 */

import { NOLWAZI_SYSTEM_INSTRUCTION } from '@/constants/nolwaziKnowledge';
import { runCopilotTurn, type CopilotContent, type ToolLogEntry } from '@/services/geminiCopilot';
import { useAuthStore } from '@/store/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Leaf, SendHorizontal, Sparkles, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Constants ────────────────────────────────────────────────────────────────
const EMERALD   = '#032f20';
const EMERALD_2 = '#0a3d28';
const GOLD      = '#C9A84C';
const WHITE     = '#ffffff';
const CREAM     = '#F7F5F0';

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

function getWelcomeText(name?: string | null): string {
  const greeting = name?.trim() ? `Abalimi (${name}), peace be with you.` : 'Abalimi (Grower), peace be with you.';
  return `${greeting} I am your specialized Imbewu Study Copilot. Struggling with a term like 'Mycorrhizae' or need swale calculations? Let me assist you.`;
}

// ── Bubble components ────────────────────────────────────────────────────────

function AssistantBubble({ msg }: { msg: Msg }) {
  return (
    <View style={{ marginBottom: 16, maxWidth: '90%', alignSelf: 'flex-start' }}>
      {/* Label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        <Leaf size={11} color={GOLD} strokeWidth={2} />
        <Text style={{ color: GOLD, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 }}>
          AGRO-BOTANICAL ASSISTANT
        </Text>
      </View>
      {/* Card */}
      <View style={{
        backgroundColor: WHITE,
        borderRadius: 14,
        borderTopLeftRadius: 2,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 2,
      }}>
        <Text style={{ color: '#1a1a1a', fontSize: 14, lineHeight: 22, fontWeight: '300' }}>
          {msg.text}
        </Text>
        {msg.toolLog && msg.toolLog.length > 0 && (
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0ece6' }}>
            {msg.toolLog.map((t, i) => (
              <Text key={i} style={{ fontSize: 11, color: '#7a7060', fontWeight: '300', lineHeight: 16 }}>
                {t.ok ? '✓' : '—'} {t.summary}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function UserBubble({ msg }: { msg: Msg }) {
  return (
    <View style={{ marginBottom: 16, maxWidth: '80%', alignSelf: 'flex-end' }}>
      <View style={{
        backgroundColor: EMERALD,
        borderRadius: 14,
        borderBottomRightRadius: 2,
        padding: 12,
        paddingHorizontal: 16,
      }}>
        <Text style={{ color: WHITE, fontSize: 14, lineHeight: 21, fontWeight: '300' }}>
          {msg.text}
        </Text>
      </View>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function NolwaziScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const queryClient = useQueryClient();
  const { profile, role, isAuthenticated, session } = useAuthStore();
  const userFirstName = profile?.first_name ?? null;
  const userLastName  = profile?.last_name  ?? null;
  const displayName   = [userFirstName, userLastName].filter(Boolean).join(' ').trim() || userFirstName;
  const insets = useSafeAreaInsets();

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
  const [input, setInput]   = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const consumedPrefillRef = useRef(false);

  const [messages, setMessages] = useState<Msg[]>([{
    id: 'welcome',
    role: 'assistant',
    text: getWelcomeText(displayName),
  }]);

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

      apiContentsRef.current = finalContents;

      if (toolLog.some((t) => t.name === 'enrolIfEligible' && t.ok)) {
        void queryClient.invalidateQueries({ queryKey: ['student-enrolments'] });
        void queryClient.invalidateQueries({ queryKey: ['available-courses'] });
        void queryClient.invalidateQueries({ queryKey: ['courses', 'published'] });
        void queryClient.invalidateQueries({ queryKey: ['course'] });
      }

      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: assistantText,
        toolLog: toolLog.length > 0 ? toolLog : undefined,
      }]);
    } catch (e) {
      apiContentsRef.current = priorContents;
      setMessages((prev) => [...prev, {
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: `Something went wrong: ${e instanceof Error ? e.message : 'Unexpected error'}`,
      }]);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [getAccessToken, input, personalizedSystemInstruction, queryClient, router]);

  useEffect(() => {
    const q = typeof params.q === 'string' ? params.q.trim() : '';
    if (!q || consumedPrefillRef.current) return;
    setInput((prev) => (prev.trim().length ? prev : q));
    consumedPrefillRef.current = true;
  }, [params.q]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: EMERALD }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ── Header ── */}
        <View style={{
          backgroundColor: EMERALD,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 20,
        }}>
          {/* Top row: title + close */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: 'rgba(201,168,76,0.15)',
                borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={16} color={GOLD} strokeWidth={1.5} />
              </View>
              <View>
                <Text style={{ color: WHITE, fontSize: 17, fontWeight: '600', letterSpacing: 0.2 }}>
                  Imbewu Copilot
                </Text>
                <Text style={{ color: GOLD, fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>
                  AGRO-ECOSYSTEM ASSISTANT
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center', justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <X size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Chat area ── */}
        <View style={{ flex: 1, backgroundColor: CREAM }}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) =>
              item.role === 'assistant'
                ? <AssistantBubble msg={item} />
                : <UserBubble msg={item} />
            }
          />

          {/* Typing indicator */}
          {sending && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={{ color: '#9a8f7f', fontSize: 12, fontStyle: 'italic' }}>
                Nolwazi is thinking…
              </Text>
            </View>
          )}
        </View>

        {/* ── Input bar ── */}
        <View style={{
          backgroundColor: WHITE,
          borderTopWidth: 1,
          borderTopColor: '#ede9e0',
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 12) + 4,
          gap: 10,
        }}>
          <View style={{
            flex: 1,
            backgroundColor: CREAM,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#ddd8ce',
            paddingHorizontal: 16,
            paddingVertical: 10,
            minHeight: 44,
            justifyContent: 'center',
          }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about mycorrhizae, swale designs, or compost..."
              placeholderTextColor="#b0a898"
              multiline
              style={{ color: '#1a1a1a', fontSize: 14, lineHeight: 20, fontWeight: '300', maxHeight: 100 }}
              editable={!sending}
              onSubmitEditing={send}
            />
          </View>

          <TouchableOpacity
            onPress={send}
            disabled={sending || !input.trim()}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: input.trim() && !sending ? EMERALD_2 : '#c8c0b4',
              alignItems: 'center', justifyContent: 'center',
            }}
            activeOpacity={0.85}
          >
            <SendHorizontal size={19} color={WHITE} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
