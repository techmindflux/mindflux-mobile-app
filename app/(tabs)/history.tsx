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
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, ChevronRight, Trash2, Brain } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useThoughts } from '@/contexts/ThoughtContext';
import { ThoughtAnalysis } from '@/types/thought';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
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
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

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
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Clock color={Colors.textTertiary} size={14} />
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 color={Colors.textTertiary} size={18} />
          </TouchableOpacity>
        </View>

        <Text style={styles.thoughtPreview} numberOfLines={2}>
          {item.originalThought}
        </Text>

        <View style={styles.layerIndicators}>
          {item.layers.map((layer, i) => (
            <View
              key={i}
              style={[
                styles.layerDot,
                {
                  backgroundColor:
                    i === 0 ? Colors.layer1 : i === 1 ? Colors.layer2 : Colors.layer3,
                },
              ]}
            />
          ))}
          <Text style={styles.layerCount}>
            {item.layers.length} layers analyzed
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewText}>View Analysis</Text>
          <ChevronRight color={Colors.primary} size={18} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { thoughts, deleteThought, isLoading } = useThoughts();

  const handlePress = (item: ThoughtAnalysis) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/thought-detail',
      params: { id: item.id },
    });
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Brain color={Colors.textTertiary} size={48} />
      </View>
      <Text style={styles.emptyTitle}>No thoughts yet</Text>
      <Text style={styles.emptySubtitle}>
        Your analyzed thoughts will appear here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#0A0A0D']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>
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
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  deleteButton: {
    padding: 4,
  },
  thoughtPreview: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  layerIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  layerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  layerCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  viewText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
