import { ThoughtAnalysis } from '../types/thought';
import { CheckInData, ThoughtNature } from '../types/checkin';

export interface EmoteLevel {
  emoji: string;
  label: string;
  color: string;
  glowColor: string;
}

const NATURE_BASE_SCORES: Record<ThoughtNature, number> = {
  clear: 82,
  ruminating: 35,
  anxious: 30,
  critical: 25,
};

const EMOTE_LEVELS: EmoteLevel[] = [
  { emoji: '😰', label: 'Distressed', color: '#EF4444', glowColor: 'rgba(239, 68, 68, 0.2)' },
  { emoji: '😟', label: 'Uneasy', color: '#F97316', glowColor: 'rgba(249, 115, 22, 0.2)' },
  { emoji: '😐', label: 'Neutral', color: '#EAB308', glowColor: 'rgba(234, 179, 8, 0.2)' },
  { emoji: '🙂', label: 'Okay', color: '#84CC16', glowColor: 'rgba(132, 204, 22, 0.2)' },
  { emoji: '😊', label: 'Good', color: '#22C55E', glowColor: 'rgba(34, 197, 94, 0.2)' },
  { emoji: '🤩', label: 'Thriving', color: '#14B8A6', glowColor: 'rgba(20, 184, 166, 0.2)' },
];

function getCheckInScore(checkIn: CheckInData): number {
  const base = NATURE_BASE_SCORES[checkIn.nature] ?? 50;
  const intensityFactor = checkIn.intensity ?? 5;

  if (checkIn.nature === 'clear') {
    return Math.min(100, base + intensityFactor * 2);
  }
  return Math.max(0, base - intensityFactor * 2);
}

function getThoughtScore(thought: ThoughtAnalysis): number {
  if (typeof thought.sentiment === 'number' && thought.sentiment >= 0 && thought.sentiment <= 100) {
    return thought.sentiment;
  }
  return 40;
}

export function calculateEmoteScore(
  thoughts: ThoughtAnalysis[],
  checkIns: CheckInData[],
): number | null {
  const recentThoughts = thoughts.slice(0, 7);
  const recentCheckIns = checkIns.slice(0, 7);

  if (recentThoughts.length === 0 && recentCheckIns.length === 0) {
    return null;
  }

  const thoughtScores = recentThoughts.map(getThoughtScore);
  const checkInScores = recentCheckIns.map(getCheckInScore);

  const allScores = [...thoughtScores, ...checkInScores];
  const avg = allScores.reduce((sum, s) => sum + s, 0) / allScores.length;

  console.log('Emote score calculated:', avg, 'from', allScores.length, 'items');
  return Math.round(avg);
}

export function getEmoteLevel(score: number | null): EmoteLevel & { score: number | null } {
  if (score === null) {
    return {
      emoji: '🫥',
      label: 'No Data',
      color: '#6B7280',
      glowColor: 'rgba(107, 114, 128, 0.15)',
      score: null,
    };
  }

  let index: number;
  if (score <= 15) index = 0;
  else if (score <= 30) index = 1;
  else if (score <= 48) index = 2;
  else if (score <= 62) index = 3;
  else if (score <= 78) index = 4;
  else index = 5;

  return { ...EMOTE_LEVELS[index], score };
}
