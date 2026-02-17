import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  Image,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Send, Layers, Target, Globe, ExternalLink, BookOpen, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useThoughts } from '../contexts/ThoughtContext';
import { PHILOSOPHERS } from '../constants/philosophers';
import { sendChatMessage, ChatMessage } from '../utils/aiService';
import {
  searchWebContent,
  buildSearchQuery,
  PerplexitySource,
} from '../utils/perplexityService';

interface SourceGroup {
  content: string;
  sources: PerplexitySource[];
}

interface ConversationMessage {
  id: string;
  role: 'philosopher' | 'user';
  content: string;
  timestamp: string;
  sourceGroup?: SourceGroup;
}

export default function PhilosopherChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { thoughts } = useThoughts();
  const scrollViewRef = useRef<ScrollView>(null);

  const { philosopherId, thoughtId } = useLocalSearchParams<{
    philosopherId: string;
    thoughtId: string;
  }>();

  const philosopher = useMemo(() => {
    return PHILOSOPHERS.find((p) => p.id === philosopherId) || PHILOSOPHERS[0];
  }, [philosopherId]);

  const thought = useMemo(() => {
    return thoughts.find((t) => t.id === thoughtId);
  }, [thoughts, thoughtId]);

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [showThoughtContext, setShowThoughtContext] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const typingAnim = useRef(new Animated.Value(0)).current;
  const contextAnim = useRef(new Animated.Value(1)).current;
  const searchPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      generateInitialAnalysis();
    }, 800);

    return () => clearTimeout(timer);
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

  useEffect(() => {
    if (isSearching) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(searchPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(searchPulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      searchPulseAnim.setValue(0);
    }
  }, [isSearching]);

  const buildThoughtContext = (): string => {
    if (!thought) return '';

    const layersText = thought.layers
      .map((l, i) => `Layer ${i + 1} (${l.title}): ${l.insight}`)
      .join('\n');

    return `The user has shared this thought for analysis:
Original Thought: "${thought.originalThought}"

The psychological analysis revealed these layers:
${layersText}

Root Cause identified: "${thought.rootCause}"

Now, as ${philosopher.name}, provide your philosophical analysis and wisdom about this thought, its layers, and root cause. Speak in your unique voice and through your philosophical framework. Start by acknowledging the thought, then offer your perspective on the root cause and layers, and finally provide guidance rooted in your philosophy.`;
  };

  const fetchWebSources = useCallback(async (
    lastMessage: string
  ): Promise<SourceGroup | undefined> => {
    if (!thought) return undefined;

    setIsSearching(true);
    try {
      const query = buildSearchQuery(
        philosopher.name,
        thought.originalThought,
        thought.rootCause,
        lastMessage
      );

      const result = await searchWebContent(
        query,
        philosopher.name,
        `This philosopher's tradition: ${philosopher.title}. Era: ${philosopher.era}. Origin: ${philosopher.origin}.`
      );

      if (result.error || result.sources.length === 0) {
        console.log('No sources found or error:', result.error);
        return undefined;
      }

      return {
        content: result.content,
        sources: result.sources,
      };
    } catch (error) {
      console.error('Error fetching web sources:', error);
      return undefined;
    } finally {
      setIsSearching(false);
    }
  }, [thought, philosopher]);

  const generateInitialAnalysis = async () => {
    setIsTyping(true);

    const contextMessage = buildThoughtContext();
    const initialMessages: ChatMessage[] = [
      { role: 'user' as const, content: contextMessage },
    ];

    try {
      const [response, sourceGroup] = await Promise.all([
        sendChatMessage(initialMessages, philosopher.systemPrompt),
        fetchWebSources(thought?.originalThought || ''),
      ]);

      let responseContent = response.content;
      if (response.error || !responseContent) {
        console.log('Using fallback for philosopher:', response.error);
        responseContent = getPhilosopherFallback();
      }

      const philosopherMessage: ConversationMessage = {
        id: '1',
        role: 'philosopher',
        content: responseContent,
        timestamp: new Date().toISOString(),
        sourceGroup,
      };

      setMessages([philosopherMessage]);
      setConversationHistory([
        { role: 'user' as const, content: contextMessage },
        { role: 'assistant' as const, content: responseContent },
      ]);
    } catch (error) {
      console.error('Error generating initial analysis:', error);
      const fallbackMessage: ConversationMessage = {
        id: '1',
        role: 'philosopher',
        content: getPhilosopherFallback(),
        timestamp: new Date().toISOString(),
      };
      setMessages([fallbackMessage]);
    }

    setIsTyping(false);
  };

  const getPhilosopherFallback = (): string => {
    const thoughtText = thought?.originalThought || 'your thought';
    switch (philosopher.id) {
      case 'buddha':
        return `Dear one, I have contemplated "${thoughtText}" with great care. This thought arises like a wave in the ocean of your mind — it has a cause, and like all waves, it will pass. The suffering you feel is rooted in attachment to a particular outcome or identity. Can you observe this thought without becoming it? The space between you and the thought — that is where freedom lives. Let us sit with this together.`;
      case 'osho':
        return `Ah, how interesting! "${thoughtText}" — do you see what you are doing? The mind is playing its oldest trick: creating a problem so it can stay busy solving it. You are not your thoughts, my friend. You are the vast sky, and these thoughts are just clouds passing through. Stop fighting them. Stop analyzing them. Just watch. The moment you become a watcher, the whole game changes. Are you ready for that?`;
      case 'marcus_aurelius':
        return `I have reflected on "${thoughtText}" as I would in my own meditations. Consider this: the thought itself has no power over you — only your judgment about it does. What is within your control here? Not the external situation, but your response to it. Strip away the story your mind has added, and look at what remains. Then ask yourself: what would a person of virtue do in this moment? That is your path forward.`;
      case 'rumi':
        return `Beloved, "${thoughtText}" — what a beautiful ache you carry. This pain is not your enemy; it is a messenger from the depths of your soul, calling you home. The wound is the place where the Light enters you. Do not turn away from this feeling. Sit with it as you would sit with an old friend. Behind every thought of separation, there is a longing for union. What is it that your heart truly seeks beneath these words?`;
      case 'lao_tzu':
        return `"${thoughtText}" — you grasp at this thought like trying to hold water in a fist. The tighter you grip, the less remains. What if you simply opened your hand? The river does not struggle to flow. The tree does not strain to grow. Your nature, too, knows its way. Stop pushing. What needs to happen will happen when you stop insisting it must.`;
      default:
        return `I have contemplated your thought deeply. There is much wisdom to be found in examining what troubles our minds. Let us explore this together.`;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (showThoughtContext) {
      Animated.timing(contextAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowThoughtContext(false));
    }

    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText.trim();
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const updatedHistory: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user' as const, content: currentInput },
    ];
    setConversationHistory(updatedHistory);

    try {
      const [response, sourceGroup] = await Promise.all([
        sendChatMessage(updatedHistory, philosopher.systemPrompt),
        fetchWebSources(currentInput),
      ]);

      let responseContent = response.content;
      if (response.error || !responseContent) {
        console.log('Using fallback for follow-up:', response.error);
        responseContent = `Thank you for sharing that. Let me reflect on your words... What you are describing touches upon something fundamental about the human experience. There is both courage and wisdom in examining our thoughts this deeply. Tell me more about what resonates with you.`;
      }

      const philosopherMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'philosopher',
        content: responseContent,
        timestamp: new Date().toISOString(),
        sourceGroup,
      };

      setMessages((prev) => [...prev, philosopherMessage]);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant' as const, content: responseContent },
      ]);
    } catch (error) {
      console.error('Error in philosopher chat:', error);
    }

    setIsTyping(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleOpenSource = useCallback((url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  }, []);

  const renderSourceCard = useCallback((sourceGroup: SourceGroup, messageId: string) => {
    if (!sourceGroup.sources.length) return null;

    return (
      <View style={[styles.sourcesContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <View style={styles.sourcesHeader}>
          <View style={[styles.sourcesIconBadge, { backgroundColor: philosopher.color + '18' }]}>
            <Globe color={philosopher.color} size={13} />
          </View>
          <Text style={[styles.sourcesTitle, { color: colors.text }]}>Sources</Text>
          <View style={[styles.sourceCountBadge, { backgroundColor: philosopher.color + '15' }]}>
            <Text style={[styles.sourceCountText, { color: philosopher.color }]}>
              {sourceGroup.sources.length}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sourcesScrollContent}
        >
          {sourceGroup.sources.map((source, index) => (
            <TouchableOpacity
              key={`${messageId}-source-${index}`}
              style={[styles.sourceChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleOpenSource(source.url)}
              activeOpacity={0.7}
            >
              <View style={[styles.sourceNumberBadge, { backgroundColor: philosopher.color + '15' }]}>
                <Text style={[styles.sourceNumber, { color: philosopher.color }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.sourceChipTitle, { color: colors.text }]} numberOfLines={1}>
                {source.title}
              </Text>
              <ExternalLink color={colors.textMuted} size={11} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {sourceGroup.content ? (
          <View style={[styles.sourceSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sourceSummaryHeader}>
              <BookOpen color={philosopher.color} size={12} />
              <Text style={[styles.sourceSummaryLabel, { color: philosopher.color }]}>
                Recommended Reading
              </Text>
            </View>
            <Text style={[styles.sourceSummaryText, { color: colors.textSecondary }]} numberOfLines={4}>
              {sourceGroup.content}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }, [colors, philosopher, handleOpenSource]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.separator }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X color={colors.textSecondary} size={22} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.philosopherAvatarSmall, { borderColor: philosopher.color + '60' }]}>
            <Image source={{ uri: philosopher.avatar }} style={styles.avatarSmall} />
          </View>
          <View>
            <Text style={[styles.headerName, { color: colors.text }]}>{philosopher.name}</Text>
            <Text style={[styles.headerRole, { color: philosopher.color }]}>{philosopher.title}</Text>
          </View>
        </View>

        <View style={styles.headerRight} />
      </View>

      {showThoughtContext && thought && (
        <Animated.View style={[styles.thoughtBanner, { backgroundColor: colors.surfaceSecondary, opacity: contextAnim }]}>
          <View style={styles.bannerRow}>
            <View style={[styles.bannerIcon, { backgroundColor: colors.primarySoft }]}>
              <Target color={colors.primary} size={14} />
            </View>
            <View style={styles.bannerText}>
              <Text style={[styles.bannerLabel, { color: colors.textMuted }]}>Analyzing thought</Text>
              <Text style={[styles.bannerThought, { color: colors.text }]} numberOfLines={1}>
                {thought.originalThought}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

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
          {thought && messages.length === 0 && !isTyping && (
            <Animated.View style={[styles.thoughtCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: fadeAnim }]}>
              <View style={styles.thoughtCardHeader}>
                <Layers color={colors.primary} size={16} />
                <Text style={[styles.thoughtCardTitle, { color: colors.text }]}>Your Thought</Text>
              </View>
              <Text style={[styles.thoughtCardText, { color: colors.textSecondary }]}>{thought.originalThought}</Text>
              <View style={[styles.thoughtCardDivider, { backgroundColor: colors.border }]} />
              <View style={styles.thoughtCardHeader}>
                <Target color={colors.primary} size={16} />
                <Text style={[styles.thoughtCardTitle, { color: colors.text }]}>Root Cause</Text>
              </View>
              <Text style={[styles.thoughtCardText, { color: colors.textSecondary }]}>{thought.rootCause}</Text>
            </Animated.View>
          )}

          {messages.map((message) => (
            <View key={message.id}>
              <View
                style={[
                  styles.messageWrapper,
                  message.role === 'user' ? styles.userMessageWrapper : styles.philosopherMessageWrapper,
                ]}
              >
                {message.role === 'philosopher' && (
                  <View style={[styles.messageAvatar, { borderColor: philosopher.color + '40' }]}>
                    <Image source={{ uri: philosopher.avatar }} style={styles.messageAvatarImage} />
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    message.role === 'user'
                      ? [styles.userBubble, { backgroundColor: philosopher.color }]
                      : [styles.philosopherBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.role === 'user'
                        ? { color: '#FFFFFF' }
                        : { color: colors.text },
                    ]}
                  >
                    {message.content}
                  </Text>
                </View>
              </View>

              {message.role === 'philosopher' && message.sourceGroup && message.sourceGroup.sources.length > 0 && (
                <View style={styles.sourceGroupWrapper}>
                  {renderSourceCard(message.sourceGroup, message.id)}
                </View>
              )}
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageWrapper, styles.philosopherMessageWrapper]}>
              <View style={[styles.messageAvatar, { borderColor: philosopher.color + '40' }]}>
                <Image source={{ uri: philosopher.avatar }} style={styles.messageAvatarImage} />
              </View>
              <View style={styles.typingColumn}>
                <Animated.View
                  style={[
                    styles.typingBubble,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      opacity: typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                    },
                  ]}
                >
                  <View style={[styles.typingDot, { backgroundColor: philosopher.color }]} />
                  <View style={[styles.typingDot, { backgroundColor: philosopher.color, opacity: 0.7 }]} />
                  <View style={[styles.typingDot, { backgroundColor: philosopher.color, opacity: 0.4 }]} />
                </Animated.View>

                {isSearching && (
                  <Animated.View
                    style={[
                      styles.searchingBadge,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        borderColor: colors.border,
                        opacity: searchPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                      },
                    ]}
                  >
                    <Globe color={philosopher.color} size={12} />
                    <Text style={[styles.searchingText, { color: colors.textSecondary }]}>
                      Searching the web...
                    </Text>
                  </Animated.View>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background, borderTopColor: colors.separator }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={`Ask ${philosopher.name} anything...`}
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
                  ? { backgroundColor: philosopher.color }
                  : { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
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
  philosopherAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  avatarSmall: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  headerRole: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  headerRight: {
    width: 40,
  },
  thoughtBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  bannerThought: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  thoughtCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    marginBottom: 8,
  },
  thoughtCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  thoughtCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  thoughtCardText: {
    fontSize: 13,
    lineHeight: 20,
  },
  thoughtCardDivider: {
    height: 1,
    marginVertical: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  philosopherMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  messageAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  messageBubble: {
    maxWidth: '78%',
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  philosopherBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 0.5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  typingColumn: {
    gap: 6,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    borderWidth: 0.5,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  searchingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 0.5,
    alignSelf: 'flex-start',
  },
  searchingText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  sourceGroupWrapper: {
    marginLeft: 36,
    marginTop: 8,
  },
  sourcesContainer: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 0.5,
    gap: 10,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sourcesIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourcesTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    flex: 1,
  },
  sourceCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sourceCountText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  sourcesScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    maxWidth: 200,
  },
  sourceNumberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceNumber: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  sourceChipTitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    flex: 1,
  },
  sourceSummary: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    gap: 6,
  },
  sourceSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sourceSummaryLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  sourceSummaryText: {
    fontSize: 12,
    lineHeight: 18,
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
