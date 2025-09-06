import { db } from '../../db/db';
import type { CheckIn, Mood } from '../../store/appStore';
import { v4 as uuidv4 } from 'uuid';

// Check-In service: encapsulates persistence and simple querying
export async function addCheckIn(input: { mood: Mood; notes?: string; createdAt?: number }): Promise<CheckIn> {
  const rec: CheckIn = {
    id: uuidv4(),
    mood: input.mood,
    notes: input.notes,
    createdAt: input.createdAt ?? Date.now(),
  };
  await db.checkIns.add(rec);
  return rec;
}

export async function listCheckIns(limit?: number): Promise<CheckIn[]> {
  const all = await db.checkIns.orderBy('createdAt').reverse().toArray();
  return typeof limit === 'number' ? all.slice(0, limit) : all;
}

export async function getMoodStats(days = 30): Promise<Record<Mood, number>> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const items = await db.checkIns.where('createdAt').above(since).toArray();
  const stats: Record<Mood, number> = { sad: 0, tired: 0, neutral: 0, calm: 0, happy: 0 };
  for (const it of items) stats[it.mood]++;
  return stats;
}

export async function getRecentNotes(n = 5): Promise<string[]> {
  const items = await listCheckIns(50);
  return items
    .map((i) => (i.notes || '').trim())
    .filter(Boolean)
    .slice(0, n);
}
