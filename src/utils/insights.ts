import type { CheckIn, JournalEntry } from '../store/appStore';

// Very lightweight, local heuristics for gentle insights. No ML, no network.
export type Insight = { id: string; title: string; detail?: string };

const POSITIVE = ['calm', 'happy', 'grateful', 'joy', 'peace', 'hope', 'progress'];
const NEGATIVE = ['sad', 'tired', 'anxious', 'angry', 'overwhelmed', 'stressed', 'lonely'];

export function summarizeMood(checkIns: CheckIn[]): Insight[] {
  const out: Insight[] = [];
  if (checkIns.length === 0) return out;
  const last7 = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = checkIns.filter((c) => c.createdAt >= last7);
  if (recent.length >= 3) {
    const scoreMap: Record<CheckIn['mood'], number> = { sad: 1, tired: 2, neutral: 3, calm: 4, happy: 5 };
    const avg = recent.reduce((s, c) => s + scoreMap[c.mood], 0) / recent.length;
    out.push({ id: 'avg7', title: `Your 7-day average mood is ${avg.toFixed(1)}` });
  }
  const frequent = Object.entries(checkIns.reduce<Record<string, number>>((acc, c) => {
    acc[c.mood] = (acc[c.mood] || 0) + 1; return acc;
  }, {})).sort((a, b) => b[1] - a[1])[0];
  if (frequent) out.push({ id: 'freq', title: `Often feeling ${frequent[0]}` });
  return out;
}

export function analyzeJournals(journals: JournalEntry[]): Insight[] {
  const out: Insight[] = [];
  if (journals.length === 0) return out;
  // Heuristic word counts (on decrypted content expected by caller)
  const text = journals.map((j: any) => (j.plain || '')).join(' ').toLowerCase();
  const pos = POSITIVE.reduce((n, w) => n + (text.split(w).length - 1), 0);
  const neg = NEGATIVE.reduce((n, w) => n + (text.split(w).length - 1), 0);
  if (pos || neg) {
    const tilt = pos >= neg ? 'balancing toward calm/hope' : 'carrying some heaviness';
    out.push({ id: 'valence', title: `Your writing seems ${tilt}`, detail: `Positive cues: ${pos}, Difficult cues: ${neg}` });
  }
  return out;
}

export function mergeInsights(a: Insight[], b: Insight[]): Insight[] {
  const seen = new Set<string>();
  return [...a, ...b].filter((i) => !seen.has(i.id) && (seen.add(i.id) || true));
}
