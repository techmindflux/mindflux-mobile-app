import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Send, Feather, Leaf, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useThoughts } from '@/contexts/ThoughtContext';
import { useCheckIns } from '@/contexts/CheckInContext';
import { calculateEmoteScore, getEmoteLevel } from '@/utils/emoteScore';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { thoughts, startAnalysis } = useThoughts();
  const { checkIns } = useCheckIns();
  const [thought, setThought] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const emoteFloatAnim = useRef(new Animated.Value(0)).current;
  const emotePulseAnim = useRef(new Animated.Value(1)).current;
  const emoteGlowAnim = useRef(new Animated.Value(0)).current;
  const scoreBarAnim = useRef(new Animated.Value(0)).current;

  const emoteScore = useMemo(() => calculateEmoteScore(thoughts, checkIns), [thoughts, checkIns]);
  const emoteLevel = useMemo(() => getEmoteLevel(emoteScore), [emoteScore]);

  const dataCount = useMemo(() => {
    const tCount = Math.min(thoughts.length, 7);
    const cCount = Math.min(checkIns.length, 7);
    return tCount + cCount;
  }, [thoughts, checkIns]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();

    const emoteFloat = Animated.loop(
      Animated.sequence([
        Animated.timing(emoteFloatAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(emoteFloatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    emoteFloat.start();

    const emotePulse = Animated.loop(
      Animated.sequence([
        Animated.timing(emotePulseAnim, {
          toValue: 1.12,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(emotePulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    emotePulse.start();

    const glowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(emoteGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(emoteGlowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    glowPulse.start();

    if (emoteScore !== null) {
      Animated.timing(scoreBarAnim, {
        toValue: emoteScore / 100,
        duration: 1200,
        useNativeDriver: false,
      }).start();
    }

    return () => {
      breathe.stop();
      emoteFloat.stop();
      emotePulse.stop();
      glowPulse.stop();
    };
  }, [emoteScore]);

  const handleSubmit = () => {
    if (!thought.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Submitting thought:', thought);
    startAnalysis(thought.trim());
    router.push('/analysis' as never);
    setThought('');
  };

  const isValid = thought.trim().length > 10;

  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const breatheOpacity = breatheAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  const emoteTranslateY = emoteFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const glowOpacity = emoteGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const TrendIcon = emoteScore !== null
    ? emoteScore >= 55 ? TrendingUp : emoteScore <= 40 ? TrendingDown : Minus
    : Minus;

  const trendLabel = emoteScore !== null
    ? emoteScore >= 55 ? 'Positive trend' : emoteScore <= 40 ? 'Needs attention' : 'Stable'
    : 'Start tracking';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 100 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.logoArea}>
              <Animated.View
                style={[
                  styles.breatheRing,
                  {
                    backgroundColor: colors.primarySoft,
                    transform: [{ scale: breatheScale }],
                    opacity: breatheOpacity,
                  },
                ]}
              />
              <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
                <Leaf color={colors.textInverse} size={28} />
              </View>
            </View>

            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>MindFlux</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              A quiet space for your thoughts
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.emoteCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
            testID="mindflux-emote-card"
          >
            <View style={styles.emoteCardInner}>
              <View style={styles.emoteLeftSection}>
                <View style={styles.emoteEmojiContainer}>
                  <Animated.View
                    style={[
                      styles.emoteGlowRing,
                      {
                        backgroundColor: emoteLevel.glowColor,
                        opacity: glowOpacity,
                        transform: [{ scale: emotePulseAnim }],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.emoteGlowRingOuter,
                      {
                        backgroundColor: emoteLevel.glowColor,
                        opacity: Animated.multiply(glowOpacity, 0.4),
                        transform: [{ scale: Animated.multiply(emotePulseAnim, 1.3) }],
                      },
                    ]}
                  />
                  <Animated.Text
                    style={[
                      styles.emoteEmoji,
                      {
                        transform: [{ translateY: emoteTranslateY }],
                      },
                    ]}
                  >
                    {emoteLevel.emoji}
                  </Animated.Text>
                </View>
              </View>

              <View style={styles.emoteRightSection}>
                <View style={styles.emoteLabelRow}>
                  <Text style={[styles.emoteTitle, { color: colors.text }]}>
                    MindFlux Emote
                  </Text>
                </View>

                <Text style={[styles.emoteMoodLabel, { color: emoteLevel.color }]}>
                  {emoteLevel.label}
                </Text>

                {emoteScore !== null ? (
                  <View style={styles.emoteScoreRow}>
                    <Text style={[styles.emoteScoreValue, { color: colors.text }]}>
                      {emoteScore}
                    </Text>
                    <Text style={[styles.emoteScoreMax, { color: colors.textMuted }]}>
                      /100
                    </Text>
                    <View style={styles.emoteTrendPill}>
                      <TrendIcon
                        size={11}
                        color={emoteLevel.color}
                      />
                      <Text style={[styles.emoteTrendText, { color: emoteLevel.color }]}>
                        {trendLabel}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emoteScoreRow}>
                    <Text style={[styles.emoteNoDataText, { color: colors.textMuted }]}>
                      {trendLabel}
                    </Text>
                  </View>
                )}

                <View style={styles.emoteBarContainer}>
                  <View style={[styles.emoteBarTrack, { backgroundColor: colors.surfaceSecondary }]}>
                    {emoteScore !== null ? (
                      <Animated.View
                        style={[
                          styles.emoteBarFill,
                          {
                            backgroundColor: emoteLevel.color,
                            width: scoreBarAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            }),
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                </View>

                <Text style={[styles.emoteDataSource, { color: colors.textMuted }]}>
                  {dataCount > 0
                    ? `Based on ${dataCount} recent ${dataCount === 1 ? 'entry' : 'entries'}`
                    : 'Analyze thoughts & check in to begin'}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.inputSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.promptContainer}>
              <Feather color={colors.primary} size={16} />
              <Text style={[styles.promptText, { color: colors.text }]}>
                What&apos;s on your mind?
              </Text>
            </View>

            <View style={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: isFocused ? colors.primary : colors.border,
              },
            ]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Share your thoughts, feelings, or worries..."
                placeholderTextColor={colors.inputPlaceholder}
                value={thought}
                onChangeText={setThought}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <View style={styles.inputFooter}>
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {thought.length}/500
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: isValid ? colors.primary : colors.surfaceSecondary,
                },
                !isValid && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={!isValid}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.submitText,
                { color: isValid ? colors.textInverse : colors.textMuted }
              ]}>
                Analyze Thought
              </Text>
              <Send
                color={isValid ? colors.textInverse : colors.textMuted}
                size={18}
              />
            </TouchableOpacity>

            <View style={styles.hintContainer}>
              <View style={[styles.hintDot, { backgroundColor: colors.layer1 }]} />
              <View style={[styles.hintDot, { backgroundColor: colors.layer2 }]} />
              <View style={[styles.hintDot, { backgroundColor: colors.layer3 }]} />
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                3 layers of understanding await
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoArea: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  breatheRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  emoteCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 28,
    overflow: 'hidden',
  },
  emoteCardInner: {
    flexDirection: 'row',
    padding: 18,
    gap: 16,
  },
  emoteLeftSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoteEmojiContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoteGlowRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  emoteGlowRingOuter: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  emoteEmoji: {
    fontSize: 40,
  },
  emoteRightSection: {
    flex: 1,
    justifyContent: 'center',
  },
  emoteLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  emoteTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    opacity: 0.6,
  },
  emoteMoodLabel: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  emoteScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 8,
  },
  emoteScoreValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  emoteScoreMax: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  emoteTrendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emoteTrendText: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  emoteNoDataText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  emoteBarContainer: {
    marginBottom: 6,
  },
  emoteBarTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  emoteBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  emoteDataSource: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  inputSection: {
    flex: 1,
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  promptText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  inputContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    minHeight: 170,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 115,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  charCount: {
    fontSize: 12,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 10,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hintText: {
    fontSize: 13,
    marginLeft: 4,
    letterSpacing: 0.2,
  },
});
