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
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, Layers, Target, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useThoughts } from '@/contexts/ThoughtContext';
import { analyzeThought } from '@/utils/analyzeThought';
import { ThoughtLayer } from '@/types/thought';

const LAYER_COLORS = [Colors.layer1, Colors.layer2, Colors.layer3];

export default function AnalysisScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
      router.back();
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
    router.back();
  };

  const handleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    completeAnalysis();
    router.back();
  };

  if (!currentAnalysis) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#0A0A0D']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X color={Colors.textSecondary} size={24} />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {isAnalyzing ? 'Analyzing...' : 'Complete'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.thoughtContainer}>
          <Text style={styles.thoughtLabel}>Your thought</Text>
          <Text style={styles.thoughtText}>{currentAnalysis.originalThought}</Text>
        </View>

        <View style={styles.layersSection}>
          <View style={styles.sectionHeader}>
            <Layers color={Colors.primary} size={20} />
            <Text style={styles.sectionTitle}>Layers of Understanding</Text>
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
                    opacity: layer ? fadeAnims[index] : 0.3,
                    borderLeftColor: color,
                  },
                ]}
              >
                <View style={styles.layerHeader}>
                  <View style={[styles.layerBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.layerNumber, { color }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.layerTitleContainer}>
                    <Text style={styles.layerTitle}>
                      {layer?.title || `Layer ${index + 1}`}
                    </Text>
                    <Text style={styles.layerDescription}>
                      {layer?.description || 'Analyzing...'}
                    </Text>
                  </View>
                  {isActive && (
                    <View style={[styles.checkmark, { backgroundColor: color }]}>
                      <Check color={Colors.background} size={14} />
                    </View>
                  )}
                </View>
                
                {layer && (
                  <Text style={styles.layerInsight}>{layer.insight}</Text>
                )}
                
                {!layer && isAnalyzing && currentStep === index && (
                  <View style={styles.analyzing}>
                    <View style={[styles.dot, styles.dot1]} />
                    <View style={[styles.dot, styles.dot2]} />
                    <View style={[styles.dot, styles.dot3]} />
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
                transform: [
                  {
                    translateY: rootCauseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[Colors.primary + '15', Colors.primaryDark + '10']}
              style={styles.rootCauseGradient}
            >
              <View style={styles.rootCauseHeader}>
                <Target color={Colors.primary} size={22} />
                <Text style={styles.rootCauseTitle}>Root Cause</Text>
              </View>
              <Text style={styles.rootCauseText}>{rootCause}</Text>
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>

      {rootCause && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.completeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.completeText}>Save & Continue</Text>
              <ArrowRight color={Colors.background} size={20} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    gap: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  thoughtLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  thoughtText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  layersSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  layerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 3,
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  layerBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  layerTitleContainer: {
    flex: 1,
  },
  layerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  layerDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerInsight: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 16,
  },
  analyzing: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  rootCauseSection: {
    marginBottom: 24,
  },
  rootCauseGradient: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  rootCauseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  rootCauseTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  rootCauseText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  completeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  completeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  completeText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.background,
  },
});
