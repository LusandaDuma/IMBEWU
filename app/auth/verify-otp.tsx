/**
 * @fileoverview OTP email verification screen — luxury emerald & gold theme.
 * Called after signup to verify the user's email address.
 */

import { supabase } from '@/services/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Leaf, RotateCcw } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);

    // Auto-advance to next box
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (digit && index === OTP_LENGTH - 1) {
      const fullCode = [...newOtp.slice(0, OTP_LENGTH - 1), digit].join('');
      if (fullCode.length === OTP_LENGTH) {
        void handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const token = code ?? otp.join('');
    if (token.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    if (!email) {
      setError('Email address is missing. Please go back and try again.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (verifyError) {
      setError('Invalid or expired code. Please try again or request a new one.');
      setIsVerifying(false);
      return;
    }

    setSuccess(true);
    setIsVerifying(false);

    // Redirect after short delay
    setTimeout(() => router.replace('/'), 1500);
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending || !email) return;
    setIsResending(true);
    setError(null);

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    setIsResending(false);

    if (resendError) {
      setError('Could not resend code. Please try again.');
      return;
    }

    setCountdown(RESEND_COOLDOWN);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={s.header}>
          <Leaf size={32} color="#C9A84C" />
          <Text style={s.logoText}>IMBEWU</Text>
        </View>

        {/* Content */}
        <View style={s.content}>

          {success ? (
            /* Success state */
            <View style={s.successCard}>
              <CheckCircle size={56} color="#C9A84C" />
              <Text style={s.successTitle}>Verified!</Text>
              <Text style={s.successBody}>
                Your email has been confirmed. Welcome to Imbewu.
              </Text>
            </View>
          ) : (
            <>
              {/* Title */}
              <Text style={s.title}>Check your inbox.</Text>
              <Text style={s.subtitle}>
                We sent a 6-digit verification code to{'\n'}
                <Text style={s.emailHighlight}>{email}</Text>
              </Text>

              {/* OTP Boxes */}
              <View style={s.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => { inputRefs.current[index] = ref; }}
                    value={digit}
                    onChangeText={text => handleOtpChange(text, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    style={[
                      s.otpBox,
                      digit ? s.otpBoxFilled : {},
                      error ? s.otpBoxError : {},
                    ]}
                  />
                ))}
              </View>

              {/* Error */}
              {error && <Text style={s.errorText}>{error}</Text>}

              {/* Verify Button */}
              <TouchableOpacity
                onPress={() => void handleVerify()}
                disabled={isVerifying || otp.join('').length < OTP_LENGTH}
                style={[
                  s.verifyBtn,
                  (isVerifying || otp.join('').length < OTP_LENGTH) && { opacity: 0.6 },
                ]}
                activeOpacity={0.85}
              >
                <Text style={s.verifyBtnText}>
                  {isVerifying ? 'Verifying…' : 'Confirm Email'}
                </Text>
              </TouchableOpacity>

              {/* Resend */}
              <TouchableOpacity
                onPress={handleResend}
                disabled={countdown > 0 || isResending}
                style={s.resendBtn}
                activeOpacity={0.75}
              >
                <RotateCcw size={14} color={countdown > 0 ? '#C4B89A' : '#C9A84C'} />
                <Text style={[s.resendText, countdown === 0 && { color: '#C9A84C' }]}>
                  {countdown > 0
                    ? `Resend code in ${countdown}s`
                    : isResending ? 'Sending…' : 'Resend code'
                  }
                </Text>
              </TouchableOpacity>

              {/* Back */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={s.backBtn}
                activeOpacity={0.75}
              >
                <Text style={s.backText}>← Back to sign up</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoText: {
    color: '#032f20',
    fontSize: 14,
    letterSpacing: 4,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  title: {
    color: '#022418',
    fontSize: 34,
    fontFamily: 'serif',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#8B7355',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  emailHighlight: {
    color: '#032f20',
    fontWeight: '700',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  otpBox: {
    width: 48,
    height: 60,
    borderWidth: 1.5,
    borderColor: '#E5DDD0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#022418',
  },
  otpBoxFilled: {
    borderColor: '#032f20',
    backgroundColor: '#032f2008',
  },
  otpBoxError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  verifyBtn: {
    backgroundColor: '#032f20',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 16,
  },
  resendText: {
    color: '#C4B89A',
    fontSize: 13,
    fontWeight: '600',
  },
  backBtn: {
    paddingVertical: 8,
  },
  backText: {
    color: '#8B7355',
    fontSize: 13,
  },
  successCard: {
    alignItems: 'center',
    gap: 16,
  },
  successTitle: {
    color: '#022418',
    fontSize: 32,
    fontFamily: 'serif',
    fontWeight: '400',
  },
  successBody: {
    color: '#8B7355',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
});
