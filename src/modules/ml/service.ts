import { db } from '../../db/db';
import type { DataContext, ModelParams } from './types';
import { buildDailyFeatureVector } from './features';
import { predictProb, trainLogistic } from './model';

const MODEL_KEY = 'clear.ml.moodRiskV1';
const INSIGHT_KEY = 'clear.ml.dailyInsight';

function loadModel(): ModelParams | null {
  try { const json = localStorage.getItem(MODEL_KEY); return json ? JSON.parse(json) : null; } catch { return null; }
}
function saveModel(m: ModelParams) { try { localStorage.setItem(MODEL_KEY, JSON.stringify(m)); } catch {} }
export function loadLatestInsight(): any | null {
  try { const json = localStorage.getItem(INSIGHT_KEY); return json ? JSON.parse(json) : null; } catch { return null; }
}

export async function collectData(): Promise<DataContext> {
  // Pull latest data locally; future: include sleep/cycle modules when present
  const [checkIns, tasks] = await Promise.all([
    db.checkIns.toArray(),
    db.tasks?.toArray?.() ?? Promise.resolve([]),
  ]);
  return { checkIns, tasks: tasks as any };
}

// Define label: 1 if moodToday <= 2 (sad/tired), else 0
function labelFromMood(moodToday: number | undefined) { return !moodToday ? 0 : (moodToday <= 2 ? 1 : 0); }

export async function trainIfNeeded(days = 60) {
  const ctx = await collectData();
  if (!ctx.checkIns.length) return loadModel();
  const now = Date.now();
  const X: number[][] = []; const y: number[] = [];
  for (let d = days; d >= 1; d--) {
    const ts = new Date(now); ts.setDate(ts.getDate() - d);
    const { x, meta } = buildDailyFeatureVector(ctx, ts.getTime());
    X.push(x);
    y.push(labelFromMood(meta.moodToday));
  }
  const init = loadModel();
  const trained = trainLogistic(X, y, init, { lr: 0.05, epochs: 120, l2: 1e-4 });
  saveModel(trained);
  return trained;
}

export async function inferToday(): Promise<{ risk: number; meta: any; message?: string }> {
  const ctx = await collectData();
  const { x, meta } = buildDailyFeatureVector(ctx, Date.now());
  const m = loadModel();
  if (!m) return { risk: 0.2, meta, message: undefined };
  const risk = predictProb(x, m);
  const msg = buildMessage(risk, meta);
  return { risk, meta, message: msg };
}

function buildMessage(risk: number, meta: any): string | undefined {
  // Gentle, contextualized messages purely local
  if (risk >= 0.7) {
    if (meta.cycleProx > 0.2) return 'You might feel low today around your cycle. Be kind to yourself.';
    if ((meta.sleepYesterday||0) < 6) return 'Low sleep can affect mood. A short rest or walk may help.';
    if (meta.compl7 < 0.3) return 'It’s okay to have off days. Start small: one tiny task today.';
    if (meta.stressFlag) return 'Stress cues detected. Try a 2‑minute breathing break.';
    return 'You might feel low today. A gentle check‑in could help.';
  }
  if (risk >= 0.4) {
    if (meta.contentFlag) return 'Content overload can impact mood. Consider a short offline pause.';
    return 'Consider a mindful moment today.';
  }
  return undefined;
}

// Integration: lightweight startup hook to retrain occasionally and store insight in state
export async function refreshDailyInsight() {
  try { await trainIfNeeded(60); } catch {}
  const res = await inferToday();
  // Store in localStorage to surface in UI modules without coupling
  try { localStorage.setItem(INSIGHT_KEY, JSON.stringify({ at: Date.now(), ...res })); } catch {}
  try { window.dispatchEvent(new CustomEvent('clear:mlInsightUpdated', { detail: res })); } catch {}
  return res;
}

// Explainability: feature contributions for today (weights * features)
export async function explainToday(): Promise<{ items: Array<{ key: string; label: string; value: number; weight: number; contribution: number; hint?: string }>; risk: number } | null> {
  const m = loadModel(); if (!m) return null;
  const ctx = await collectData();
  const { x, meta } = buildDailyFeatureVector(ctx, Date.now());
  const names = ['Mood today', '7d mood avg', '7d task completion', 'Sleep yesterday (h)', '7d sleep avg (h)', 'Cycle proximity', 'Stress cues', 'Content load'];
  const keys = ['moodToday','moodAvg7','compl7','sleepYesterday','sleepAvg7','cycleProx','stressFlag','contentFlag'] as const;
  const items = x.map((xi, idx) => {
    const weight = m.weights[idx] ?? 0;
    const contribution = xi * weight;
    const key = keys[idx] as string;
    const label = names[idx];
  const hints: Record<string, string> = {
      moodToday: 'Lower mood today raises risk.',
      moodAvg7: 'Consistently lower mood increases risk.',
      compl7: 'Lower task completion may correlate with dips.',
      sleepYesterday: 'Short sleep may impact mood.',
      sleepAvg7: 'Sustained low sleep can elevate risk.',
      cycleProx: 'Pre‑menstrual window may affect mood.',
      stressFlag: 'Stress signals in notes raise risk.',
      contentFlag: 'High content/social usage may affect mood.'
    };
  const raw = (meta as Record<string, unknown>)[key];
  const value = typeof raw === 'boolean' ? (raw ? 1 : 0) : Number(raw ?? 0);
  return { key, label, value, weight, contribution, hint: hints[key] };
  });
  const risk = predictProb(x, m);
  // Sort by absolute contribution, descending
  items.sort((a,b)=>Math.abs(b.contribution)-Math.abs(a.contribution));
  return { items, risk };
}
