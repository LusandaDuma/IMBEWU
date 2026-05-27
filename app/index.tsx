/**
 * @fileoverview App entry — luxury dark-green splash while auth resolves,
 * then routes to the correct dashboard or the public catalogue.
 */

import { PublicCatalogHome } from '@/components/screens/PublicCatalogHome';
import { BRAND_ICON } from '@/constants/brandAssets';
import { getHomeHrefForRole } from '@/constants/routing';
import { useAuthStore } from '@/store/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// ── Loading copy that rotates during the splash ───────────────────────────────
const LOADING_PHRASES = [
  'Opening ancestral knowledge archives…',
  'Preparing your learning path…',
  'Cultivating your experience…',
  'Setting up your learning environment…',
];

// ── Concentric ring radii (largest first so they layer correctly) ─────────────
const RINGS = [110, 88, 68];

export default function Index() {
  const { profile, isAuthenticated, isLoading } = useAuthStore();

  // ── Animation values ──────────────────────────────────────────────────────
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(20)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const ring1Rotate = useRef(new Animated.Value(0)).current;
  const ring2Rotate = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;

  // ── Rotating phrase ───────────────────────────────────────────────────────
  const [phraseIndex, setPhraseIndex] = useState(0);
  const phraseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLoading) return;

    // Fade-in entrance
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar fills to ~85 % (we never know the true load time)
    Animated.timing(progressWidth, {
      toValue: 85,
      duration: 3000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // Outer ring slow clockwise spin
    Animated.loop(
      Animated.timing(ring1Rotate, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Inner ring slow counter-clockwise spin
    Animated.loop(
      Animated.timing(ring2Rotate, {
        toValue: -1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Icon gentle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.08,
          duration: 1800,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Phrase rotation every 2.2 s
    const interval = setInterval(() => {
      Animated.timing(phraseOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setPhraseIndex((i) => (i + 1) % LOADING_PHRASES.length);
        Animated.timing(phraseOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [isLoading]);

  // ── Route guard ──────────────────────────────────────────────────────────
  if (!isLoading && isAuthenticated && profile) {
    return <Redirect href={getHomeHrefForRole(profile.role)} />;
  }

  if (!isLoading && !isAuthenticated) {
    return <PublicCatalogHome />;
  }

  // ── Interpolations ───────────────────────────────────────────────────────
  const ring1Deg = ring1Rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const ring2Deg = ring2Rotate.interpolate({
    inputRange: [-1, 0],
    outputRange: ['-360deg', '0deg'],
  });
  const progressInterpolated = progressWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={['#0a2416', '#0d2e1a', '#071a0f']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.root}
    >
      {/* Subtle radial glow behind the icon */}
      <View style={styles.glowBehind} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslate }],
          },
        ]}
      >
        {/* ── Header badge ─────────────────────────────────────────────── */}
        <View style={styles.headerBadge}>
          <View style={styles.headerDot} />
          <Text style={styles.headerBadgeText}>IMBEWU PREMIUM</Text>
        </View>

        {/* ── Version chip ─────────────────────────────────────────────── */}
        <View style={styles.versionChip}>
          <Text style={styles.versionText}>V2.6 LIVE</Text>
        </View>

        {/* ── Concentric rings + icon ───────────────────────────────────── */}
        <View style={styles.ringContainer}>
          {/* Outermost static ring (dashed look via opacity) */}
          <View style={[styles.ring, { width: RINGS[0] * 2, height: RINGS[0] * 2, borderRadius: RINGS[0], borderColor: 'rgba(212,175,55,0.18)' }]} />

          {/* Spinning outer ring */}
          <Animated.View
            style={[
              styles.ring,
              styles.ringSpinnable,
              {
                width: RINGS[1] * 2,
                height: RINGS[1] * 2,
                borderRadius: RINGS[1],
                borderColor: 'rgba(212,175,55,0.45)',
                transform: [{ rotate: ring1Deg }],
              },
            ]}
          />

          {/* Spinning inner ring (opposite) */}
          <Animated.View
            style={[
              styles.ring,
              styles.ringSpinnable,
              {
                width: RINGS[2] * 2,
                height: RINGS[2] * 2,
                borderRadius: RINGS[2],
                borderColor: 'rgba(212,175,55,0.25)',
                transform: [{ rotate: ring2Deg }],
              },
            ]}
          />

          {/* Icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconPulse }] }]}>
            <Image source={BRAND_ICON} style={styles.icon} resizeMode="contain" />
          </Animated.View>
        </View>

        {/* ── Wordmark ─────────────────────────────────────────────────── */}
        <Text style={styles.wordmark}>IMBEWU</Text>

        {/* ── Rotating phrase ──────────────────────────────────────────── */}
        <Animated.Text style={[styles.phrase, { opacity: phraseOpacity }]}>
          {LOADING_PHRASES[phraseIndex]}
        </Animated.Text>

        {/* ── Progress bar ─────────────────────────────────────────────── */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>INITIALIZATION PROGRESS</Text>
            <Animated.Text style={styles.progressLabel}>
              {/* Static approximation — real % would need actual loading events */}
              67%
            </Animated.Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { width: progressInterpolated }]}
            />
          </View>
        </View>

        {/* ── Bottom status row ────────────────────────────────────────── */}
        <Text style={styles.statusText}>
          SETTING UP YOUR PERSONALIZED LEARNING EXPERIENCE
        </Text>

        {/* Three-dot pulse */}
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <DotPulse key={i} delay={i * 220} />
          ))}
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

// ── Animated dot ─────────────────────────────────────────────────────────────
function DotPulse({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const GOLD = '#d4af37';
const GOLD_DIM = 'rgba(212,175,55,0.55)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBehind: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(22,90,40,0.35)',
    // soft glow — shadow only works on iOS/Android, skip for web compat
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 32,
  },

  // ── Header badge
  headerBadge: {
    position: 'absolute',
    top: -240,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: GOLD_DIM,
  },
  headerBadgeText: {
    color: GOLD_DIM,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '300',
  },

  // ── Version chip
  versionChip: {
    position: 'absolute',
    top: -240,
    right: 0,
    borderWidth: 1,
    borderColor: GOLD_DIM,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 3,
  },
  versionText: {
    color: GOLD_DIM,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '300',
  },

  // ── Rings
  ringContainer: {
    width: RINGS[0] * 2,
    height: RINGS[0] * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
  },
  ringSpinnable: {
    borderStyle: 'solid',
  },

  // ── Icon
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 42,
    height: 42,
    tintColor: GOLD,
  },

  // ── Wordmark
  wordmark: {
    color: '#f5f0e8',
    fontSize: 34,
    letterSpacing: 14,
    fontWeight: '200',
    marginBottom: 14,
  },

  // ── Phrase
  phrase: {
    color: GOLD_DIM,
    fontSize: 13,
    fontStyle: 'italic',
    letterSpacing: 0.5,
    fontWeight: '300',
    marginBottom: 40,
    textAlign: 'center',
  },

  // ── Progress
  progressSection: {
    width: '100%',
    marginBottom: 24,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: 'rgba(245,240,232,0.4)',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '400',
  },
  progressTrack: {
    height: 1,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 1,
  },

  // ── Status
  statusText: {
    color: 'rgba(245,240,232,0.3)',
    fontSize: 9,
    letterSpacing: 2.5,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 14,
  },

  // ── Dots
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: GOLD_DIM,
  },
});
