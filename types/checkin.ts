export type ThoughtNature = 'ruminating' | 'anxious' | 'critical' | 'clear';

export interface ThoughtNatureOption {
  id: ThoughtNature;
  label: string;
  description: string;
  color: string;
  gradientColors: [string, string];
}

export interface SubCategory {
  id: string;
  label: string;
}

export interface CheckInData {
  nature: ThoughtNature;
  subCategories: string[];
  intensity: number;
  journalEntry?: string;
  activity?: string;
  companion?: string;
  location?: string;
  createdAt: string;
}

export interface CoachingMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  timestamp: string;
}
