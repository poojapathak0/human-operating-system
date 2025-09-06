import { collectData } from '../ml/service';
import { buildDailyFeatureVector } from '../ml/features';

export type Nudge = { id: string; title: string; detail?: string };

const NUDGE_KEY = 'clear.nudges.latest';

export async function generateNudges(): Promise<Nudge[]> {
  const ctx = await collectData();
  const { meta } = buildDailyFeatureVector(ctx, Date.now());
  const out: Nudge[] = [];
  const push = (title: string, detail?: string) => out.push({ id: `${Date.now()}-${out.length}`, title, detail });
  if ((meta.sleepYesterday ?? 0) < 6) push('Power rest (10 min)', 'Low sleep detected. A short rest can help.');
  if ((meta.compl7 ?? 1) < 0.4) push('Tiny task', 'Pick the smallest next action (1–2 minutes).');
  if (meta.stressFlag) push('2‑minute breathing', 'Reset your nervous system with a short breath break.');
  if (meta.contentFlag) push('Screen break', 'Take a quick offline pause to reduce overload.');
  if ((meta.cycleProx ?? 0) > 0.2) push('Gentle self‑care', 'PMS window — be extra kind to yourself.');
  if (out.length === 0) push('Mindful check‑in', 'Note one feeling, one need, one small step.');
  try { localStorage.setItem(NUDGE_KEY, JSON.stringify({ at: Date.now(), items: out })); } catch {}
  return out;
}

export function loadLatestNudges(): Nudge[] | null {
  try {
    const raw = localStorage.getItem(NUDGE_KEY);
    if (!raw) return null;
    const { items } = JSON.parse(raw);
    return items || null;
  } catch { return null; }
}
