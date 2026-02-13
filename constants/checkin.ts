import { ThoughtNatureOption, SubCategory } from '@/types/checkin';

export const THOUGHT_NATURES: ThoughtNatureOption[] = [
  {
    id: 'ruminating',
    label: 'Ruminating',
    description: 'Stuck in the past, replaying',
    color: '#9B7ED9',
    gradientColors: ['#B794F6', '#8B5CF6'],
  },
  {
    id: 'anxious',
    label: 'Anxious',
    description: "Worrying about what's next",
    color: '#F5A962',
    gradientColors: ['#FBBF24', '#F97316'],
  },
  {
    id: 'critical',
    label: 'Critical',
    description: 'Harsh inner voice, judging',
    color: '#F06B77',
    gradientColors: ['#FB7185', '#EF4444'],
  },
  {
    id: 'clear',
    label: 'Clear',
    description: 'Present, calm, focused',
    color: '#2DD4BF',
    gradientColors: ['#34D399', '#14B8A6'],
  },
];

export const SUB_CATEGORIES: Record<string, SubCategory[]> = {
  ruminating: [
    { id: 'replaying', label: 'Replaying' },
    { id: 'regretting', label: 'Regretting' },
    { id: 'dwelling', label: 'Dwelling' },
    { id: 'overthinking', label: 'Overthinking' },
    { id: 'fixating', label: 'Fixating' },
    { id: 'analyzing', label: 'Analyzing' },
  ],
  anxious: [
    { id: 'worrying', label: 'Worrying' },
    { id: 'catastrophizing', label: 'Catastrophizing' },
    { id: 'what-ifs', label: 'What-ifs' },
    { id: 'anticipating', label: 'Anticipating' },
    { id: 'dreading', label: 'Dreading' },
    { id: 'panicking', label: 'Panicking' },
  ],
  critical: [
    { id: 'judging', label: 'Judging' },
    { id: 'comparing', label: 'Comparing' },
    { id: 'criticizing', label: 'Criticizing' },
    { id: 'blaming', label: 'Blaming' },
    { id: 'doubting', label: 'Doubting' },
    { id: 'shaming', label: 'Shaming' },
  ],
  clear: [
    { id: 'present', label: 'Present' },
    { id: 'calm', label: 'Calm' },
    { id: 'focused', label: 'Focused' },
    { id: 'grateful', label: 'Grateful' },
    { id: 'peaceful', label: 'Peaceful' },
    { id: 'content', label: 'Content' },
  ],
};

export const ACTIVITIES = [
  'Working',
  'Eating',
  'Resting',
  'Commuting',
  'Exercising',
  'Socializing',
  'Reading',
  'Meditating',
];

export const COMPANIONS = [
  'By Myself',
  'Friends',
  'Family',
  'Co-Workers',
  'Partner',
  'Pets',
  'Strangers',
];

export const LOCATIONS = [
  'Home',
  'Work',
  'School',
  'Outside',
  'Commuting',
  'Gym',
  'Cafe',
  'Nature',
];
