import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, ChevronRight, Trash2, Leaf, Heart, Brain, MapPin, Users, Activity } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useThoughts } from '../../contexts/ThoughtContext';
import { useCheckIns, CheckInRecord } from '../../contexts/CheckInContext';
import { ThoughtAnalysis } from '../../types/thought';
import { THOUGHT_NATURES, SUB_CATEGORIES } from '../../constants/checkin';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function ThoughtCard({
  item,
  index,
  onPress,
  onDelete,
}: {
  item: ThoughtAnalysis;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Clock color={colors.textMuted} size={13} />
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onDelete();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 color={colors.textMuted} size={16} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.thoughtPreview, { color: colors.text }]} numberOfLines={2}>
          {item.originalThought}
        </Text>

        <View style={styles.layerIndicators}>
          {item.layers.map((_, i) => (
            <View
              key={i}
              style={[
                styles.layerDot,
                {
                  backgroundColor:
                    i === 0 ? colors.layer1 : i === 1 ? colors.layer2 : colors.layer3,
                },
              ]}
            />
          ))}
          <Text style={[styles.layerCount, { color: colors.textSecondary }]}>
            {item.layers.length} layers
          </Text>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.separator }]}>
          <Text style={[styles.viewText, { color: colors.primary }]}>View Analysis</Text>
          <ChevronRight color={colors.primary} size={16} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function CheckInCard({
  item,
  index,
  onDelete,
}: {
  item: CheckInRecord;
  index: number;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const natureData = THOUGHT_NATURES.find((n) => n.id === item.nature) || THOUGHT_NATURES[0];
  const subCategoryLabels = item.subCategories
    .map((id) => SUB_CATEGORIES[item.nature]?.find((s) => s.id === id)?.label || id)
    .filter(Boolean);

  const intensityLabel = item.intensity < 0.33 ? 'Mild' : item.intensity < 0.66 ? 'Strong' : 'Intense';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Clock color={colors.textMuted} size={13} />
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onDelete();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 color={colors.textMuted} size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.checkinNatureRow}>
          <View style={[styles.natureBadge, { backgroundColor: `${natureData.color}18` }]}>
            <View style={[styles.natureDot, { backgroundColor: natureData.color }]} />
            <Text style={[styles.natureLabel, { color: natureData.color }]}>{natureData.label}</Text>
          </View>
          <View style={[styles.intensityBadge, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.intensityText, { color: colors.textSecondary }]}>{intensityLabel}</Text>
          </View>
        </View>

        {subCategoryLabels.length > 0 && (
          <View style={styles.subCategoriesRow}>
            {subCategoryLabels.map((label) => (
              <View key={label} style={[styles.subCategoryChip, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.subCategoryText, { color: colors.textSecondary }]}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        {(item.activity || item.companion || item.location) && (
          <View style={[styles.checkinMeta, { borderTopColor: colors.separator }]}>
            {item.activity ? (
              <View style={styles.metaItem}>
                <Activity color={colors.textMuted} size={13} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>{item.activity}</Text>
              </View>
            ) : null}
            {item.companion ? (
              <View style={styles.metaItem}>
                <Users color={colors.textMuted} size={13} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>{item.companion}</Text>
              </View>
            ) : null}
            {item.location ? (
              <View style={styles.metaItem}>
                <MapPin color={colors.textMuted} size={13} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>{item.location}</Text>
              </View>
            ) : null}
          </View>
        )}

        {item.journalEntry ? (
          <View style={[styles.journalPreview, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.journalPreviewText, { color: colors.textSecondary }]} numberOfLines={2}>
              &ldquo;{item.journalEntry}&rdquo;
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

type TabType = 'thoughts' | 'checkins';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { thoughts, deleteThought } = useThoughts();
  const { checkIns, deleteCheckIn } = useCheckIns();
  const [activeTab, setActiveTab] = useState<TabType>('thoughts');
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const switchTab = useCallback((tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    Animated.spring(tabIndicatorAnim, {
      toValue: tab === 'thoughts' ? 0 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
  }, [tabIndicatorAnim]);

  const handleThoughtPress = useCallback((item: ThoughtAnalysis) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/thought-detail' as never,
      params: { id: item.id },
    });
  }, [router]);

  const renderThoughtEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Brain color={colors.textMuted} size={36} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No thoughts yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Your analyzed thoughts will appear here
      </Text>
    </View>
  );

  const renderCheckinEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Heart color={colors.textMuted} size={36} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No check-ins yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Your mood check-ins will appear here
      </Text>
    </View>
  );

  const thoughtsCount = thoughts.length;
  const checkInsCount = checkIns.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>History</Text>

        <View style={[styles.tabBar, { backgroundColor: colors.surfaceSecondary }]}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                backgroundColor: colors.surface,
                transform: [
                  {
                    translateX: tabIndicatorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <TouchableOpacity
            style={styles.tab}
            onPress={() => switchTab('thoughts')}
            activeOpacity={0.7}
          >
            <Brain
              color={activeTab === 'thoughts' ? colors.primary : colors.textMuted}
              size={15}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'thoughts' ? colors.text : colors.textMuted },
              ]}
            >
              Thoughts
            </Text>
            <View style={[styles.countBadge, { backgroundColor: activeTab === 'thoughts' ? colors.primarySoft : colors.surfaceSecondary }]}>
              <Text style={[styles.countText, { color: activeTab === 'thoughts' ? colors.primary : colors.textMuted }]}>
                {thoughtsCount}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => switchTab('checkins')}
            activeOpacity={0.7}
          >
            <Heart
              color={activeTab === 'checkins' ? colors.primary : colors.textMuted}
              size={15}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'checkins' ? colors.text : colors.textMuted },
              ]}
            >
              Check-ins
            </Text>
            <View style={[styles.countBadge, { backgroundColor: activeTab === 'checkins' ? colors.primarySoft : colors.surfaceSecondary }]}>
              <Text style={[styles.countText, { color: activeTab === 'checkins' ? colors.primary : colors.textMuted }]}>
                {checkInsCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'thoughts' ? (
        <FlatList
          key="thoughts"
          data={thoughts}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ThoughtCard
              item={item}
              index={index}
              onPress={() => handleThoughtPress(item)}
              onDelete={() => deleteThought(item.id)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
            thoughts.length === 0 && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderThoughtEmpty}
        />
      ) : (
        <FlatList
          key="checkins"
          data={checkIns}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <CheckInCard
              item={item}
              index={index}
              onDelete={() => deleteCheckIn(item.id)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
            checkIns.length === 0 && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderCheckinEmpty}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: '50%',
    height: '100%',
    borderRadius: 11,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 22,
    alignItems: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  cardContainer: {
    marginBottom: 14,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  thoughtPreview: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 14,
  },
  layerIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  layerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  layerCount: {
    fontSize: 12,
    marginLeft: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 0.5,
  },
  viewText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  checkinNatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  natureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  natureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  natureLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  intensityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  subCategoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  subCategoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subCategoryText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  checkinMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  journalPreview: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
  },
  journalPreviewText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
});
