import React, { useState, useRef, useEffect } from 'react';
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
import { Send, Feather, Leaf } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useThoughts } from '@/contexts/ThoughtContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { startAnalysis } = useThoughts();
  const [thought, setThought] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;

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
    return () => breathe.stop();
  }, []);

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
    marginBottom: 36,
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
