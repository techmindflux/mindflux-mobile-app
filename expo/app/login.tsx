import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Leaf } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const { signInWithGoogle, signInAsGuest, isAuthenticating, googleAuthReady } = useAuth();
  const { colors, isDark } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, []);

  const breatheScale = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const breatheOpacity = breatheAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.15, 0.35, 0.15],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.backgroundDecor}>
        <View style={[styles.decorCircle, styles.decorCircle1, { backgroundColor: colors.primarySoft }]} />
        <View style={[styles.decorCircle, styles.decorCircle2, { backgroundColor: colors.primarySoft }]} />
      </View>

      <SafeAreaView style={styles.content}>
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScale }],
            }
          ]}
        >
          <View style={styles.logoArea}>
            <Animated.View
              style={[
                styles.breatheRing,
                {
                  backgroundColor: colors.primary,
                  transform: [{ scale: breatheScale }],
                  opacity: breatheOpacity,
                },
              ]}
            />
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <Leaf color={colors.textInverse} size={36} />
            </View>
          </View>

          <Text style={[styles.appName, { color: colors.text }]}>MindFlux</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Discover the layers of your mind
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.featureSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {['AI-powered thought analysis', 'Uncover root causes', 'Personal coaching sessions'].map((text, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: i === 0 ? colors.layer1 : i === 1 ? colors.layer2 : colors.layer3 }]} />
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>{text}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View
          style={[
            styles.buttonSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.googleButton,
              { backgroundColor: colors.primary },
              !googleAuthReady && styles.buttonDisabled,
            ]}
            onPress={signInWithGoogle}
            disabled={isAuthenticating || !googleAuthReady}
            activeOpacity={0.8}
          >
            {isAuthenticating ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={[styles.googleButtonText, { color: colors.textInverse }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.guestButton, { borderColor: colors.border }]}
            onPress={signInAsGuest}
            disabled={isAuthenticating}
            activeOpacity={0.8}
          >
            <User color={colors.textSecondary} size={18} />
            <Text style={[styles.guestButtonText, { color: colors.text }]}>Continue as Guest</Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  decorCircle1: {
    width: 300,
    height: 300,
    top: -80,
    right: -80,
    opacity: 0.5,
  },
  decorCircle2: {
    width: 200,
    height: 200,
    bottom: height * 0.25,
    left: -60,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 50,
  },
  logoArea: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  breatheRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 38,
    fontWeight: '700' as const,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  featureSection: {
    gap: 16,
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featureText: {
    fontSize: 15,
  },
  buttonSection: {
    gap: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
  },
  dividerText: {
    fontSize: 14,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
