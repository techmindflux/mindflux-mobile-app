import React, { useRef, useEffect } from 'react';
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
import { Clock, ChevronRight, Trash2, Leaf } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useThoughts } from '@/contexts/ThoughtContext';
import { ThoughtAnalysis } from '@/types/thought';

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

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { thoughts, deleteThought } = useThoughts();

  const handlePress = (item: ThoughtAnalysis) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/thought-detail' as never,
      params: { id: item.id },
    });
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSecondary }]}>
        <Leaf color={colors.textMuted} size={40} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No thoughts yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Your analyzed thoughts will appear here
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>History</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {thoughts.length} {thoughts.length === 1 ? 'thought' : 'thoughts'} analyzed
        </Text>
      </View>

      <FlatList
        data={thoughts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ThoughtCard
            item={item}
            index={index}
            onPress={() => handlePress(item)}
            onDelete={() => deleteThought(item.id)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
          thoughts.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
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
