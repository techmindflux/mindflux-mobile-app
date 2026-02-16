import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Layers, Target, Calendar } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useThoughts } from '../contexts/ThoughtContext';

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ThoughtDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { thoughts } = useThoughts();

  const LAYER_COLORS = [colors.layer1, colors.layer2, colors.layer3];

  const thought = useMemo(() => {
    return thoughts.find((t) => t.id === id);
  }, [thoughts, id]);

  if (!thought) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Thought not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.separator }]}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X color={colors.textSecondary} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analysis Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dateContainer}>
          <Calendar color={colors.textMuted} size={14} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatFullDate(thought.createdAt)}</Text>
        </View>

        <View style={[styles.thoughtContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.thoughtLabel, { color: colors.textMuted }]}>Original Thought</Text>
          <Text style={[styles.thoughtText, { color: colors.text }]}>{thought.originalThought}</Text>
        </View>

        <View style={styles.layersSection}>
          <View style={styles.sectionHeader}>
            <Layers color={colors.primary} size={18} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Layers of Understanding</Text>
          </View>

          {thought.layers.map((layer, index) => {
            const color = LAYER_COLORS[index];
            return (
              <View
                key={layer.id}
                style={[styles.layerCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: color }]}
              >
                <View style={styles.layerHeader}>
                  <View style={[styles.layerBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.layerNumber, { color }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.layerTitleContainer}>
                    <Text style={[styles.layerTitle, { color: colors.text }]}>{layer.title}</Text>
                    <Text style={[styles.layerDescription, { color: colors.textSecondary }]}>{layer.description}</Text>
                  </View>
                </View>
                <Text style={[styles.layerInsight, { color: colors.textSecondary }]}>{layer.insight}</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.rootCauseCard, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '30' }]}>
          <View style={styles.rootCauseHeader}>
            <Target color={colors.primary} size={20} />
            <Text style={[styles.rootCauseTitle, { color: colors.primary }]}>Root Cause</Text>
          </View>
          <Text style={[styles.rootCauseText, { color: colors.text }]}>{thought.rootCause}</Text>
        </View>
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
    paddingTop: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 13,
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
  layerInsight: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
  },
  rootCauseCard: {
    borderRadius: 18,
    padding: 22,
    marginBottom: 24,
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
