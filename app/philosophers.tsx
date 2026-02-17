import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, ArrowRight, Quote } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { PHILOSOPHERS, Philosopher } from '../constants/philosophers';

export default function PhilosophersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { thoughtId } = useLocalSearchParams<{ thoughtId: string }>();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(PHILOSOPHERS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    PHILOSOPHERS.forEach((_, index) => {
      Animated.timing(cardAnims[index], {
        toValue: 1,
        duration: 500,
        delay: 150 + index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleSelectPhilosopher = (philosopher: Philosopher) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/philosopher-chat' as never,
      params: {
        philosopherId: philosopher.id,
        thoughtId: thoughtId || '',
      },
    });
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.separator }]}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surface }]}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X color={colors.textSecondary} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Choose a Guide</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.introSection, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={[styles.introIconWrap, { backgroundColor: colors.primarySoft }]}>
            <Quote color={colors.primary} size={22} />
          </View>
          <Text style={[styles.introTitle, { color: colors.text }]}>Wisdom from the Masters</Text>
          <Text style={[styles.introSubtitle, { color: colors.textSecondary }]}>
            Each philosopher will analyze your thought through the lens of their unique philosophy and offer personalized guidance.
          </Text>
        </Animated.View>

        {PHILOSOPHERS.map((philosopher, index) => (
          <Animated.View
            key={philosopher.id}
            style={{
              opacity: cardAnims[index],
              transform: [{
                translateY: cardAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            }}
          >
            <TouchableOpacity
              style={[styles.philosopherCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleSelectPhilosopher(philosopher)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <View style={[styles.avatarContainer, { borderColor: philosopher.color + '40' }]}>
                  <Image
                    source={{ uri: philosopher.avatar }}
                    style={styles.avatar}
                  />
                  <View style={[styles.avatarGlow, { backgroundColor: philosopher.color + '20' }]} />
                </View>

                <View style={styles.cardInfo}>
                  <Text style={[styles.philosopherName, { color: colors.text }]}>{philosopher.name}</Text>
                  <Text style={[styles.philosopherTitle, { color: philosopher.color }]}>{philosopher.title}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.metaBadge, { backgroundColor: philosopher.color + '12' }]}>
                      <Text style={[styles.metaText, { color: philosopher.color }]}>{philosopher.era}</Text>
                    </View>
                    <View style={[styles.metaBadge, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>{philosopher.origin}</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.arrowWrap, { backgroundColor: philosopher.color + '15' }]}>
                  <ArrowRight color={philosopher.color} size={18} />
                </View>
              </View>

              <Text style={[styles.philosopherBio, { color: colors.textSecondary }]} numberOfLines={2}>
                {philosopher.shortBio}
              </Text>

              <View style={[styles.cardDivider, { backgroundColor: philosopher.color + '15' }]} />

              <View style={styles.cardFooter}>
                <View style={[styles.footerDot, { backgroundColor: philosopher.color }]} />
                <Text style={[styles.footerText, { color: colors.textMuted }]}>Tap to begin conversation</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  headerSpacer: {
    width: 38,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  introIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  philosopherCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 0.5,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  avatarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
  cardInfo: {
    flex: 1,
  },
  philosopherName: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  philosopherTitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  arrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  philosopherBio: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
});
