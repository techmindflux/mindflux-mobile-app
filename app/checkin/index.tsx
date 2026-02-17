import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { THOUGHT_NATURES } from '../../constants/checkin';
import { ThoughtNature } from '../../types/checkin';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = (width - 80) / 2;

export default function CheckInNatureScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(THOUGHT_NATURES.map(() => new Animated.Value(0.8))).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    scaleAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleSelectNature = (nature: ThoughtNature) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/checkin/subcategory' as never,
      params: { nature },
    });
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 12 }]}
        onPress={handleClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X color={colors.textSecondary} size={22} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            What&apos;s the nature of your thoughts?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Tap the one that resonates most
          </Text>

          <View style={styles.circlesContainer}>
            {THOUGHT_NATURES.map((nature, index) => (
              <Animated.View
                key={nature.id}
                style={[
                  styles.circleWrapper,
                  { transform: [{ scale: scaleAnims[index] }] },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.circle,
                    { backgroundColor: isDark ? nature.color + 'CC' : nature.color },
                  ]}
                  onPress={() => handleSelectNature(nature.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.circleLabel}>{nature.label}</Text>
                  <Text style={styles.circleDescription}>{nature.description}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: '300' as const,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
  },
  circlesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  circle: {
    width: '100%',
    height: '100%',
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  circleLabel: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  circleDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 17,
  },
});
