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
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { THOUGHT_NATURES, SUB_CATEGORIES } from '@/constants/checkin';
import { ThoughtNature } from '@/types/checkin';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = (width - 60) / 3;

export default function SubCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { nature } = useLocalSearchParams<{ nature: ThoughtNature }>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(
    SUB_CATEGORIES[nature || 'ruminating'].map(() => new Animated.Value(0.8))
  ).current;

  const natureData = THOUGHT_NATURES.find((n) => n.id === nature) || THOUGHT_NATURES[0];
  const subCategories = SUB_CATEGORIES[nature || 'ruminating'];

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
      pathname: '/checkin/details',
      params: {
        nature,
        subCategories: selectedCategories.join(','),
      },
    });
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft color="#636366" size={24} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.title}>What&apos;s your mind doing right now?</Text>
          <Text style={styles.subtitle}>Select all that apply</Text>

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
                        backgroundColor: natureData.color,
                        opacity: isSelected ? 1 : 0.7,
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

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedCategories.length === 0 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedCategories.length === 0}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.continueText,
              selectedCategories.length === 0 && styles.continueTextDisabled,
            ]}
          >
            {selectedCategories.length > 0
              ? `Continue with ${selectedCategories.length} selected`
              : 'Select thoughts above'}
          </Text>
          <ArrowRight
            color={selectedCategories.length > 0 ? '#636366' : '#C7C7CC'}
            size={20}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F3',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingBottom: 120,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '300' as const,
    color: '#2C2C2E',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
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
    fontSize: 15,
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
    backgroundColor: 'rgba(247, 246, 243, 0.95)',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  continueButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#2C2C2E',
  },
  continueTextDisabled: {
    color: '#C7C7CC',
  },
});
