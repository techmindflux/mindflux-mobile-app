import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Send, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { THOUGHT_NATURES, SUB_CATEGORIES } from '@/constants/checkin';
import { ThoughtNature, CoachingMessage } from '@/types/checkin';
import { sendChatMessage, getLuminaFallbackResponse, ChatMessage } from '@/utils/aiService';
import { useTheme } from '@/contexts/ThemeContext';

export default function CoachingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const { nature, subCategories, intensity, journalEntry, activity, companion, location } = useLocalSearchParams<{
    nature: ThoughtNature;
    subCategories: string;
    intensity: string;
    journalEntry: string;
    activity: string;
    companion: string;
    location: string;
  }>();

  const [messages, setMessages] = useState<CoachingMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;

  const natureData = THOUGHT_NATURES.find((n) => n.id === nature) || THOUGHT_NATURES[0];
  const selectedSubCategories = subCategories?.split(',') || [];
  const subCategoryLabels = selectedSubCategories
    .map((id) => SUB_CATEGORIES[nature || 'ruminating'].find((s) => s.id === id)?.label || id)
    .join(', ');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const contextParts: string[] = [`experiencing ${subCategoryLabels.toLowerCase()}`];
    if (intensity) {
      const intensityVal = parseFloat(intensity);
      const intensityLabel = intensityVal < 0.33 ? 'mild' : intensityVal < 0.66 ? 'strong' : 'intense';
      contextParts.push(`with ${intensityLabel} intensity`);
    }
    if (activity) contextParts.push(`while ${activity.toLowerCase()}`);
    if (companion) contextParts.push(`with ${companion.toLowerCase()}`);
    if (location) contextParts.push(`at ${location.toLowerCase()}`);

    let greeting = `Hello, I'm Lumina, your mindfulness coach. I see you're ${contextParts.join(', ')}.`;
    if (journalEntry) {
      greeting += ` I also read your journal entry. Thank you for sharing that.`;
    }
    greeting += ` This is a safe space to explore what's on your mind. What would you like to share about what you're feeling right now?`;

    const initialMessage: CoachingMessage = {
      id: '1',
      role: 'coach',
      content: greeting,
      timestamp: new Date().toISOString(),
    };

    setTimeout(() => {
      setMessages([initialMessage]);
    }, 800);
  }, []);

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: CoachingMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const contextParts: string[] = [
      `The user is experiencing: ${subCategoryLabels}.`,
      `Intensity level: ${intensity} (0-1 scale).`,
    ];
    if (journalEntry) contextParts.push(`Journal entry: "${journalEntry}"`);
    if (activity) contextParts.push(`Currently doing: ${activity}.`);
    if (companion) contextParts.push(`With: ${companion}.`);
    if (location) contextParts.push(`Location: ${location}.`);
    const contextMessage = contextParts.join(' ');
    const updatedHistory: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user' as const, content: inputText.trim() },
    ];

    setConversationHistory(updatedHistory);

    const getAIResponse = async () => {
      const messagesWithContext: ChatMessage[] = [
        { role: 'user' as const, content: contextMessage },
        ...updatedHistory,
      ];

      const response = await sendChatMessage(messagesWithContext);

      let responseContent = response.content;
      if (response.error || !responseContent) {
        console.log('Using fallback response due to:', response.error);
        responseContent = getLuminaFallbackResponse(inputText.trim(), contextMessage);
      }

      const coachMessage: CoachingMessage = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: responseContent,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, coachMessage]);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant' as const, content: responseContent },
      ]);
      setIsTyping(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    getAIResponse();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.separator }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X color={colors.textSecondary} size={22} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.luminaAvatar, { backgroundColor: natureData.color }]}>
            <Sparkles color="#FFFFFF" size={18} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Lumina</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Your mindfulness coach</Text>
          </View>
        </View>

        <View style={styles.headerRight} />
      </View>

      <Animated.View style={[styles.sessionInfo, { opacity: fadeAnim }]}>
        <View style={[styles.sessionBadge, { backgroundColor: `${natureData.color}15` }]}>
          <View style={[styles.sessionDot, { backgroundColor: natureData.color }]} />
          <Text style={[styles.sessionText, { color: natureData.color }]}>
            {natureData.label} · {subCategoryLabels}
          </Text>
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <Animated.View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.role === 'user' ? styles.userMessageWrapper : styles.coachMessageWrapper,
              ]}
            >
              {message.role === 'coach' && (
                <View style={[styles.messageAvatar, { backgroundColor: natureData.color }]}>
                  <Sparkles color="#FFFFFF" size={12} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user'
                    ? [styles.userBubble, { backgroundColor: colors.primary }]
                    : [styles.coachBubble, { backgroundColor: colors.surface }],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user'
                      ? { color: colors.textInverse }
                      : { color: colors.text },
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            </Animated.View>
          ))}

          {isTyping && (
            <View style={[styles.messageWrapper, styles.coachMessageWrapper]}>
              <View style={[styles.messageAvatar, { backgroundColor: natureData.color }]}>
                <Sparkles color="#FFFFFF" size={12} />
              </View>
              <Animated.View
                style={[
                  styles.typingBubble,
                  {
                    backgroundColor: colors.surface,
                    opacity: typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                  },
                ]}
              >
                <View style={[styles.typingDot, { backgroundColor: colors.textMuted }]} />
                <View style={[styles.typingDot, { backgroundColor: colors.textMuted }]} />
                <View style={[styles.typingDot, { backgroundColor: colors.textMuted }]} />
              </Animated.View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background, borderTopColor: colors.separator }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Share what's on your mind..."
              placeholderTextColor={colors.inputPlaceholder}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim()
                  ? { backgroundColor: natureData.color }
                  : { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Send color={inputText.trim() ? '#FFFFFF' : colors.textMuted} size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  closeButton: {
    padding: 8,
    width: 40,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  luminaAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  headerRight: {
    width: 40,
  },
  sessionInfo: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  sessionDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  sessionText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  coachMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 13,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  coachBubble: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
    borderWidth: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
