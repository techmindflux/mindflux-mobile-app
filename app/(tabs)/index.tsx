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
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Sparkles, Brain } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useThoughts } from '@/contexts/ThoughtContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startAnalysis } = useThoughts();
  const [thought, setThought] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const handleSubmit = () => {
    if (!thought.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Submitting thought:', thought);
    startAnalysis(thought.trim());
    router.push('/analysis');
    setThought('');
  };

  const isValid = thought.trim().length > 10;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#12121A', Colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }
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
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.logoGradient}
              >
                <Brain color={Colors.background} size={32} />
              </LinearGradient>
            </Animated.View>
            
            <Text style={styles.title}>MindFlux</Text>
            <Text style={styles.subtitle}>
              Explore the layers beneath your thoughts
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
              <Sparkles color={Colors.primary} size={18} />
              <Text style={styles.promptText}>What&apos;s on your mind?</Text>
            </View>

            <View style={[
              styles.inputContainer,
              isFocused && styles.inputContainerFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Share your thoughts, feelings, or worries..."
                placeholderTextColor={Colors.textTertiary}
                value={thought}
                onChangeText={setThought}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              
              <View style={styles.inputFooter}>
                <Text style={styles.charCount}>
                  {thought.length}/500
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                !isValid && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isValid}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isValid ? [Colors.primary, Colors.primaryDark] : [Colors.surfaceLight, Colors.surfaceLight]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[
                  styles.submitText,
                  !isValid && styles.submitTextDisabled
                ]}>
                  Analyze Thought
                </Text>
                <Send
                  color={isValid ? Colors.background : Colors.textTertiary}
                  size={20}
                />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>
                Our AI will explore 3 layers of your thought to uncover its root cause
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputSection: {
    flex: 1,
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  promptText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  inputContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    minHeight: 180,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
  },
  input: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 120,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  submitTextDisabled: {
    color: Colors.textTertiary,
  },
  hintContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  hintText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
