import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { X, Check, Layers, Target, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useThoughts } from '../contexts/ThoughtContext';
import { analyzeThought } from '../utils/analyzeThought';
import { ThoughtLayer } from '../types/thought';

export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const {
    currentAnalysis,
    analysisLayers,
    rootCause,
    isAnalyzing,
    addLayer,
    setAnalysisRootCause,
    completeAnalysis,
    clearCurrentAnalysis,
  } = useThoughts();

  const LAYER_COLORS = [colors.layer1, colors.layer2, colors.layer3];

  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const rootCauseAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!currentAnalysis) {
      if (navigation.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
      return;
    }

    console.log('Starting analysis process');

    analyzeThought(
      currentAnalysis.originalThought,
      (layer: ThoughtLayer) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        addLayer(layer);
        setCurrentStep(layer.id);

        Animated.parallel([
          Animated.timing(fadeAnims[layer.id - 1], {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(progressAnim, {
            toValue: layer.id / 4,
            duration: 500,
            useNativeDriver: false,
          }),
        ]).start();
      },
      (cause: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAnalysisRootCause(cause);
        setCurrentStep(4);

        Animated.parallel([
          Animated.timing(rootCauseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
        ]).start();
      }
    );
  }, [currentAnalysis?.id]);

  const handleClose = () => {
    clearCurrentAnalysis();
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    completeAnalysis();
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  if (!currentAnalysis) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surface }]}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X color={colors.textSecondary} size={22} />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {isAnalyzing ? 'Analyzing...' : 'Complete'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.thoughtContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.thoughtLabel, { color: colors.textMuted }]}>Your thought</Text>
          <Text style={[styles.thoughtText, { color: colors.text }]}>{currentAnalysis.originalThought}</Text>
        </View>

        <View style={styles.layersSection}>
          <View style={styles.sectionHeader}>
            <Layers color={colors.primary} size={18} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Layers of Understanding</Text>
          </View>

          {[0, 1, 2].map((index) => {
            const layer = analysisLayers[index];
            const isActive = currentStep > index;
            const color = LAYER_COLORS[index];

            return (
              <Animated.View
                key={index}
                style={[
                  styles.layerCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderLeftColor: color,
                    opacity: layer ? fadeAnims[index] : 0.3,
                  },
                ]}
              >
                <View style={styles.layerHeader}>
                  <View style={[styles.layerBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.layerNumber, { color }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.layerTitleContainer}>
                    <Text style={[styles.layerTitle, { color: colors.text }]}>
                      {layer?.title || `Layer ${index + 1}`}
                    </Text>
                    <Text style={[styles.layerDescription, { color: colors.textSecondary }]}>
                      {layer?.description || 'Analyzing...'}
                    </Text>
                  </View>
                  {isActive && (
                    <View style={[styles.checkmark, { backgroundColor: color }]}>
                      <Check color={colors.textInverse} size={13} />
                    </View>
                  )}
                </View>

                {layer && (
                  <Text style={[styles.layerInsight, { color: colors.textSecondary }]}>{layer.insight}</Text>
                )}

                {!layer && isAnalyzing && currentStep === index && (
                  <View style={styles.analyzing}>
                    <View style={[styles.dot, { backgroundColor: colors.textMuted, opacity: 0.4 }]} />
                    <View style={[styles.dot, { backgroundColor: colors.textMuted, opacity: 0.6 }]} />
                    <View style={[styles.dot, { backgroundColor: colors.textMuted, opacity: 0.8 }]} />
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>

        {rootCause && (
          <Animated.View
            style={[
              styles.rootCauseSection,
              {
                opacity: rootCauseAnim,
                transform: [{
                  translateY: rootCauseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={[styles.rootCauseCard, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '30' }]}>
              <View style={styles.rootCauseHeader}>
                <Target color={colors.primary} size={20} />
                <Text style={[styles.rootCauseTitle, { color: colors.primary }]}>Root Cause</Text>
              </View>
              <Text style={[styles.rootCauseText, { color: colors.text }]}>{rootCause}</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {rootCause && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.separator }]}>
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: colors.primary }]}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Text style={[styles.completeText, { color: colors.textInverse }]}>Save & Continue</Text>
            <ArrowRight color={colors.textInverse} size={18} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    gap: 6,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  thoughtContainer: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 0.5,
  },
  thoughtLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  thoughtText: {
    fontSize: 15,
    lineHeight: 23,
  },
  layersSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  layerCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 0.5,
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  layerBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerNumber: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  layerTitleContainer: {
    flex: 1,
  },
  layerTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  layerDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerInsight: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
  },
  analyzing: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  rootCauseSection: {
    marginBottom: 24,
  },
  rootCauseCard: {
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
  },
  rootCauseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  rootCauseTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  rootCauseText: {
    fontSize: 15,
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 0.5,
  },
  completeButton: {
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 10,
  },
  completeText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
