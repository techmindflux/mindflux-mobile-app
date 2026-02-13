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
import { LinearGradient } from 'expo-linear-gradient';
import { X, Layers, Target, Calendar } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useThoughts } from '@/contexts/ThoughtContext';

const LAYER_COLORS = [Colors.layer1, Colors.layer2, Colors.layer3];

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { thoughts } = useThoughts();

  const thought = useMemo(() => {
    return thoughts.find((t) => t.id === id);
  }, [thoughts, id]);

  if (!thought) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Thought not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#0A0A0D']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X color={Colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dateContainer}>
          <Calendar color={Colors.textTertiary} size={16} />
          <Text style={styles.dateText}>{formatFullDate(thought.createdAt)}</Text>
        </View>

        <View style={styles.thoughtContainer}>
          <Text style={styles.thoughtLabel}>Original Thought</Text>
          <Text style={styles.thoughtText}>{thought.originalThought}</Text>
        </View>

        <View style={styles.layersSection}>
          <View style={styles.sectionHeader}>
            <Layers color={Colors.primary} size={20} />
            <Text style={styles.sectionTitle}>Layers of Understanding</Text>
          </View>

          {thought.layers.map((layer, index) => {
            const color = LAYER_COLORS[index];

            return (
              <View
                key={layer.id}
                style={[styles.layerCard, { borderLeftColor: color }]}
              >
                <View style={styles.layerHeader}>
                  <View style={[styles.layerBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.layerNumber, { color }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.layerTitleContainer}>
                    <Text style={styles.layerTitle}>{layer.title}</Text>
                    <Text style={styles.layerDescription}>{layer.description}</Text>
                  </View>
                </View>
                <Text style={styles.layerInsight}>{layer.insight}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.rootCauseSection}>
          <LinearGradient
            colors={[Colors.primary + '15', Colors.primaryDark + '10']}
            style={styles.rootCauseGradient}
          >
            <View style={styles.rootCauseHeader}>
              <Target color={Colors.primary} size={22} />
              <Text style={styles.rootCauseTitle}>Root Cause</Text>
            </View>
            <Text style={styles.rootCauseText}>{thought.rootCause}</Text>
          </LinearGradient>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
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
    fontSize: 14,
    color: Colors.textTertiary,
  },
  thoughtContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderWidth: 1,
    borderColor: Colors.border,
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
  layerInsight: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 16,
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
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
});
