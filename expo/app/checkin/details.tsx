import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { THOUGHT_NATURES, SUB_CATEGORIES, ACTIVITIES, COMPANIONS, LOCATIONS } from '../../constants/checkin';
import { ThoughtNature } from '../../types/checkin';
import { useTheme } from '../../contexts/ThemeContext';
import { useCheckIns } from '../../contexts/CheckInContext';
import { CheckInData } from '../../types/checkin';

function CustomSlider({
  value,
  onValueChange,
  trackColor,
  inactiveTrackColor,
}: {
  value: number;
  onValueChange: (v: number) => void;
  trackColor: string;
  inactiveTrackColor: string;
}) {
  const trackWidth = useRef(0);
  const currentValue = useRef(value);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const clamped = Math.min(1, Math.max(0, x / trackWidth.current));
        currentValue.current = clamped;
        onValueChange(clamped);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const clamped = Math.min(1, Math.max(0, x / trackWidth.current));
        currentValue.current = clamped;
        onValueChange(clamped);
      },
    })
  ).current;

  const pct = `${(value * 100).toFixed(1)}%`;

  return (
    <View
      style={styles.customSliderTrack}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <View style={[styles.customSliderFill, { width: pct, backgroundColor: trackColor }]} />
      <View style={[styles.customSliderInactive, { flex: 1, backgroundColor: inactiveTrackColor }]} />
      <View
        style={[
          styles.customSliderThumb,
          { left: pct, backgroundColor: trackColor },
        ]}
      />
    </View>
  );
}

export default function CheckInDetailsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { nature, subCategories } = useLocalSearchParams<{
    nature: ThoughtNature;
    subCategories: string;
  }>();

  const [intensity, setIntensity] = useState(0.6);
  const [journalExpanded, setJournalExpanded] = useState(false);
  const [journalEntry, setJournalEntry] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const [customActivities, setCustomActivities] = useState<string[]>([]);
  const [customCompanions, setCustomCompanions] = useState<string[]>([]);
  const [customLocations, setCustomLocations] = useState<string[]>([]);

  const [addingActivity, setAddingActivity] = useState(false);
  const [addingCompanion, setAddingCompanion] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);

  const [newActivityText, setNewActivityText] = useState('');
  const [newCompanionText, setNewCompanionText] = useState('');
  const [newLocationText, setNewLocationText] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const natureData = THOUGHT_NATURES.find((n) => n.id === nature) || THOUGHT_NATURES[0];
  const selectedSubCategories = subCategories?.split(',') || [];
  const subCategoryLabels = selectedSubCategories.map(
    (id) => SUB_CATEGORIES[nature || 'ruminating'].find((s) => s.id === id)?.label || id
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const getIntensityLabel = () => {
    if (intensity < 0.33) return 'Mild';
    if (intensity < 0.66) return 'Strong';
    return 'Intense';
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const { addCheckIn } = useCheckIns();

  const handleStartSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const checkInData: CheckInData = {
      nature: nature || 'ruminating',
      subCategories: selectedSubCategories,
      intensity,
      journalEntry: journalEntry || undefined,
      activity: selectedActivity || undefined,
      companion: selectedCompanion || undefined,
      location: selectedLocation || undefined,
      createdAt: new Date().toISOString(),
    };
    addCheckIn(checkInData);

    router.push({
      pathname: '/coaching' as never,
      params: {
        nature,
        subCategories,
        intensity: intensity.toString(),
        journalEntry: journalEntry || '',
        activity: selectedActivity || '',
        companion: selectedCompanion || '',
        location: selectedLocation || '',
      },
    });
  };

  const handleAddCustomItem = (
    text: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    existingDefaults: string[],
    existingCustom: string[],
    selectSetter: React.Dispatch<React.SetStateAction<string | null>>,
    clearText: () => void,
    closeAdding: () => void,
  ) => {
    const trimmed = text.trim();
    if (!trimmed) {
      closeAdding();
      return;
    }
    const allItems = [...existingDefaults, ...existingCustom];
    if (allItems.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      selectSetter(allItems.find((item) => item.toLowerCase() === trimmed.toLowerCase()) || trimmed);
      closeAdding();
      clearText();
      return;
    }
    setter((prev) => [...prev, trimmed]);
    selectSetter(trimmed);
    closeAdding();
    clearText();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const AddButton = ({ onPress }: { onPress: () => void }) => (
    <TouchableOpacity
      style={[
        styles.tag,
        styles.addTag,
        { borderColor: colors.border, borderStyle: 'dashed' as const },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <Plus color={colors.textMuted} size={16} />
    </TouchableOpacity>
  );

  const InlineAddInput = ({
    value,
    onChangeText,
    onSubmit,
    onCancel,
    placeholder,
  }: {
    value: string;
    onChangeText: (t: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    placeholder: string;
  }) => (
    <View style={[styles.inlineInputWrapper, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
      <TextInput
        style={[styles.inlineInput, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoFocus
        onSubmitEditing={onSubmit}
        returnKeyType="done"
      />
      <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <X color={colors.textMuted} size={16} />
      </TouchableOpacity>
    </View>
  );

  const TagButton = ({
    label,
    isSelected,
    onPress,
  }: {
    label: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.tag,
        {
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.tagText,
        { color: isSelected ? colors.textInverse : colors.text },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 12 }]}
        onPress={handleBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft color={colors.textSecondary} size={22} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View style={[styles.emotionIcon, { backgroundColor: natureData.color }]}>
              <View style={styles.emotionIconInner} />
            </View>
            <Text style={[styles.feelingLabel, { color: colors.textSecondary }]}>I&apos;m feeling</Text>
            <Text style={[styles.feelingValue, { color: natureData.color }]}>
              {subCategoryLabels.join(', ')}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.intensityHeader}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>How intense is this feeling?</Text>
              <View style={[styles.intensityBadge, { backgroundColor: `${natureData.color}20` }]}>
                <Text style={[styles.intensityBadgeText, { color: natureData.color }]}>
                  {getIntensityLabel()}
                </Text>
              </View>
            </View>
            <View style={[styles.sliderContainer, { backgroundColor: colors.surface }]}>
              <CustomSlider
                value={intensity}
                onValueChange={setIntensity}
                trackColor={natureData.color}
                inactiveTrackColor={colors.border}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Barely noticeable</Text>
                <Text style={[styles.sliderLabel, { color: colors.textMuted }]}>Overwhelming</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.journalToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setJournalExpanded(!journalExpanded)}
            activeOpacity={0.7}
          >
            <Text style={[styles.journalToggleText, { color: colors.text }]}>Add Journal Entry (optional)</Text>
            {journalExpanded ? (
              <ChevronUp color={colors.textMuted} size={18} />
            ) : (
              <ChevronDown color={colors.textMuted} size={18} />
            )}
          </TouchableOpacity>

          {journalExpanded && (
            <TextInput
              style={[styles.journalInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Write about what's on your mind..."
              placeholderTextColor={colors.inputPlaceholder}
              value={journalEntry}
              onChangeText={setJournalEntry}
              multiline
              textAlignVertical="top"
            />
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What are you doing?</Text>
            <View style={styles.tagsContainer}>
              {[...ACTIVITIES, ...customActivities].map((activity) => (
                <TagButton
                  key={activity}
                  label={activity}
                  isSelected={selectedActivity === activity}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedActivity(selectedActivity === activity ? null : activity);
                  }}
                />
              ))}
              {addingActivity ? (
                <InlineAddInput
                  value={newActivityText}
                  onChangeText={setNewActivityText}
                  placeholder="Add activity"
                  onSubmit={() => handleAddCustomItem(newActivityText, setCustomActivities, ACTIVITIES, customActivities, setSelectedActivity, () => setNewActivityText(''), () => setAddingActivity(false))}
                  onCancel={() => { setAddingActivity(false); setNewActivityText(''); }}
                />
              ) : (
                <AddButton onPress={() => setAddingActivity(true)} />
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Who are you with?</Text>
            <View style={styles.tagsContainer}>
              {[...COMPANIONS, ...customCompanions].map((companion) => (
                <TagButton
                  key={companion}
                  label={companion}
                  isSelected={selectedCompanion === companion}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCompanion(selectedCompanion === companion ? null : companion);
                  }}
                />
              ))}
              {addingCompanion ? (
                <InlineAddInput
                  value={newCompanionText}
                  onChangeText={setNewCompanionText}
                  placeholder="Add companion"
                  onSubmit={() => handleAddCustomItem(newCompanionText, setCustomCompanions, COMPANIONS, customCompanions, setSelectedCompanion, () => setNewCompanionText(''), () => setAddingCompanion(false))}
                  onCancel={() => { setAddingCompanion(false); setNewCompanionText(''); }}
                />
              ) : (
                <AddButton onPress={() => setAddingCompanion(true)} />
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Where are you?</Text>
            <View style={styles.tagsContainer}>
              {[...LOCATIONS, ...customLocations].map((location) => (
                <TagButton
                  key={location}
                  label={location}
                  isSelected={selectedLocation === location}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedLocation(selectedLocation === location ? null : location);
                  }}
                />
              ))}
              {addingLocation ? (
                <InlineAddInput
                  value={newLocationText}
                  onChangeText={setNewLocationText}
                  placeholder="Add location"
                  onSubmit={() => handleAddCustomItem(newLocationText, setCustomLocations, LOCATIONS, customLocations, setSelectedLocation, () => setNewLocationText(''), () => setAddingLocation(false))}
                  onCancel={() => { setAddingLocation(false); setNewLocationText(''); }}
                />
              ) : (
                <AddButton onPress={() => setAddingLocation(true)} />
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.sessionButton, { backgroundColor: colors.primary }]}
          onPress={handleStartSession}
          activeOpacity={0.9}
        >
          <Text style={[styles.sessionButtonText, { color: colors.textInverse }]}>Start Coaching Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 50,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emotionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emotionIconInner: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  feelingLabel: {
    fontSize: 22,
    fontWeight: '300' as const,
    fontStyle: 'italic',
  },
  feelingValue: {
    fontSize: 22,
    fontWeight: '300' as const,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  intensityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  intensityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  intensityBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  sliderContainer: {
    borderRadius: 16,
    padding: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 11,
  },
  journalToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 0.5,
  },
  journalToggleText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  journalInput: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    minHeight: 100,
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 0.5,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  addTag: {
    paddingHorizontal: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  inlineInputWrapper: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  inlineInput: {
    fontSize: 14,
    minWidth: 80,
    paddingVertical: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sessionButton: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
  },
  sessionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  customSliderTrack: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 4,
    overflow: 'visible',
  },
  customSliderFill: {
    height: 6,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  customSliderInactive: {
    height: 6,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  customSliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});
