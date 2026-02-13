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
import { LinearGradient } from 'expo-linear-gradient';
import { THOUGHT_NATURES, SUB_CATEGORIES } from '@/constants/checkin';
import { ThoughtNature, CoachingMessage } from '@/types/checkin';
import { sendChatMessage, getLuminaFallbackResponse, ChatMessage } from '@/utils/aiService';



export default function CoachingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { nature, subCategories, intensity } = useLocalSearchParams<{
    nature: ThoughtNature;
    subCategories: string;
    intensity: string;
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

    const initialMessage: CoachingMessage = {
      id: '1',
      role: 'coach',
      content: `Hello, I'm Lumina, your mindfulness coach. I see you're experiencing ${subCategoryLabels.toLowerCase()}. This is a safe space to explore what's on your mind. What would you like to share about what you're feeling right now?`,
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

    const contextMessage = `The user is experiencing: ${subCategoryLabels}. Intensity level: ${intensity}/5.`;
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#F7F6F3', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X color="#636366" size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={[styles.luminaAvatar, { backgroundColor: natureData.color }]}>
            <Sparkles color="#FFFFFF" size={20} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Lumina</Text>
            <Text style={styles.headerSubtitle}>Your mindfulness coach</Text>
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
                  <Sparkles color="#FFFFFF" size={14} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.coachBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userText : styles.coachText,
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
                <Sparkles color="#FFFFFF" size={14} />
              </View>
              <Animated.View
                style={[
                  styles.typingBubble,
                  { opacity: typingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                ]}
              >
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </Animated.View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Share what's on your mind..."
              placeholderTextColor="#8E8E93"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim() ? { backgroundColor: natureData.color } : styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Send color={inputText.trim() ? '#FFFFFF' : '#C7C7CC'} size={18} />
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
    backgroundColor: '#F7F6F3',
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
    width: 44,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  luminaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  headerRight: {
    width: 44,
  },
  sessionInfo: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sessionText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 14,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#1C1C1E',
    borderBottomRightRadius: 6,
  },
  coachBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  coachText: {
    color: '#1C1C1E',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C7C7CC',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F7F6F3',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
});
