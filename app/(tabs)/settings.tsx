import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Info,
  Shield,
  Heart,
  ExternalLink,
  Trash2,
  MessageCircle,
  LogOut,
  User,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { useThoughts } from '@/contexts/ThoughtContext';
import { useAuth } from '@/contexts/AuthContext';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
  rightElement?: React.ReactNode;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
  rightElement,
}: SettingItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.settingIcon,
        { backgroundColor: danger ? colors.errorSoft : colors.surfaceSecondary },
      ]}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: danger ? colors.error : colors.text }]}>
          {title}
        </Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightElement}
      {!rightElement && showArrow && onPress && (
        <ExternalLink color={colors.textMuted} size={16} />
      )}
    </TouchableOpacity>
  );
}

function ThemeSelector() {
  const { colors, themeMode, setMode } = useTheme();

  const options = [
    { mode: 'light' as const, icon: Sun, label: 'Light' },
    { mode: 'dark' as const, icon: Moon, label: 'Dark' },
    { mode: 'system' as const, icon: Monitor, label: 'Auto' },
  ];

  return (
    <View style={[styles.themeSelector, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      {options.map((opt) => {
        const isActive = themeMode === opt.mode;
        const Icon = opt.icon;
        return (
          <TouchableOpacity
            key={opt.mode}
            style={[
              styles.themeOption,
              isActive && { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode(opt.mode);
            }}
            activeOpacity={0.7}
          >
            <Icon
              color={isActive ? colors.textInverse : colors.textSecondary}
              size={16}
            />
            <Text style={[
              styles.themeOptionText,
              { color: isActive ? colors.textInverse : colors.textSecondary },
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { thoughts } = useThoughts();
  const { user, signOut } = useAuth();

  const handleClearData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your analyzed thoughts. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('mindflux_thoughts');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>

        <View style={styles.userSection}>
          <View style={[styles.userAvatar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.primary }]}>
            {user?.photo ? (
              <Text style={[styles.userAvatarText, { color: colors.primary }]}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <User color={colors.primary} size={26} />
            )}
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Guest'}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email || 'Guest Account'}
          </Text>
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{thoughts.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Thoughts</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{thoughts.length * 3}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Layers</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Appearance</Text>
          <ThemeSelector />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>About</Text>
          <SettingItem
            icon={<Info color={colors.primary} size={18} />}
            title="How It Works"
            subtitle="Learn about the analysis process"
            onPress={() => {
              Alert.alert(
                'How MindFlux Works',
                'MindFlux uses AI-powered analysis to explore your thoughts through three layers:\n\n1. Surface Emotion\n2. Underlying Belief\n3. Core Pattern\n\nFinally, we reveal the root cause to help you understand yourself better.'
              );
            }}
          />
          <SettingItem
            icon={<Shield color={colors.layer1} size={18} />}
            title="Privacy"
            subtitle="Your data stays on your device"
            onPress={() => {
              Alert.alert(
                'Privacy',
                'All your thoughts and analyses are stored locally on your device. We don\'t collect or transmit any personal data.'
              );
            }}
          />
          <SettingItem
            icon={<Heart color={colors.accent} size={18} />}
            title="Mental Health Resources"
            subtitle="Get professional support"
            onPress={() => {
              Alert.alert(
                'Important',
                'MindFlux is not a substitute for professional mental health care. If you\'re struggling, please reach out to a qualified therapist or counselor.',
                [{ text: 'OK' }]
              );
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Support</Text>
          <SettingItem
            icon={<MessageCircle color={colors.primary} size={18} />}
            title="Send Feedback"
            subtitle="Help us improve MindFlux"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Data</Text>
          <SettingItem
            icon={<Trash2 color={colors.error} size={18} />}
            title="Clear All Data"
            subtitle="Delete all analyzed thoughts"
            onPress={handleClearData}
            danger
            showArrow={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Account</Text>
          <SettingItem
            icon={<LogOut color={colors.error} size={18} />}
            title="Sign Out"
            subtitle={user?.isGuest ? 'Exit guest session' : 'Sign out of your account'}
            onPress={handleSignOut}
            danger
            showArrow={false}
          />
        </View>

        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Made with care for your mental wellness
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  userAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
  },
  userAvatarText: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 22,
    marginBottom: 28,
    borderWidth: 0.5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 0.5,
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    borderWidth: 0.5,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  themeSelector: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    borderWidth: 0.5,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.2,
  },
});
