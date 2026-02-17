import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { THOUGHT_NATURES, SUB_CATEGORIES } from '../../constants/checkin';
import { ThoughtNature } from '../../types/checkin';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = (width - 60) / 3;

export default function SubCategoryScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { nature } = useLocalSearchParams<{ nature: ThoughtNature }>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const subCategories = SUB_CATEGORIES[nature || 'ruminating'];
  const scaleAnims = useRef(
    subCategories.map(() => new Animated.Value(0.8))
  ).current;

  const natureData = THOUGHT_NATURES.find((n) => n.id === nature) || THOUGHT_NATURES[0];

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
        delay: index * 80,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const toggleCategory = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleContinue = () => {
    if (selectedCategories.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/checkin/details' as never,
      params: {
        nature,
        subCategories: selectedCategories.join(','),
      },
    });
  };

  const handleBack = () => {
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
        style={[styles.backButton, { top: insets.top + 12 }]}
        onPress={handleBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft color={colors.textSecondary} size={22} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            What&apos;s your mind doing right now?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Select all that apply</Text>

          <View style={styles.circlesContainer}>
            {subCategories.map((category, index) => {
              const isSelected = selectedCategories.includes(category.id);
              return (
                <Animated.View
                  key={category.id}
                  style={[
                    styles.circleWrapper,
                    { transform: [{ scale: scaleAnims[index] }] },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.circle,
                      {
                        backgroundColor: isDark ? natureData.color + 'CC' : natureData.color,
                        opacity: isSelected ? 1 : 0.65,
                      },
                    ]}
                    onPress={() => toggleCategory(category.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.circleLabel}>{category.label}</Text>
                    {isSelected && <View style={styles.selectedIndicator} />}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedCategories.length > 0 ? colors.primary : colors.surfaceSecondary,
            },
            selectedCategories.length === 0 && { opacity: 0.5 },
          ]}
          onPress={handleContinue}
          disabled={selectedCategories.length === 0}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.continueText,
              { color: selectedCategories.length > 0 ? colors.textInverse : colors.textMuted },
            ]}
          >
            {selectedCategories.length > 0
              ? `Continue with ${selectedCategories.length} selected`
              : 'Select thoughts above'}
          </Text>
          <ArrowRight
            color={selectedCategories.length > 0 ? colors.textInverse : colors.textMuted}
            size={18}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 120,
  },
  content: {
    paddingHorizontal: 20,
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
    marginBottom: 32,
  },
  circlesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
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
    padding: 16,
  },
  circleLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  continueText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
