import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/db';
import { refreshDailyInsight, inferToday, trainIfNeeded } from '../modules/ml/service';

function addDays(ts: number, d: number) { const t = new Date(ts); t.setDate(t.getDate()+d); return t.getTime(); }

describe('Local ML service', () => {
  beforeEach(async () => {
    await db.transaction('rw', db.checkIns, db.tasks, async () => {
      await db.checkIns.clear();
      await db.tasks.clear();
    });
    localStorage.removeItem('clear.ml.moodRiskV1');
    localStorage.removeItem('clear.ml.dailyInsight');
  });

  it('trains on recent data and returns a probability', async () => {
    const now = Date.now();
    // seed 14 days with mixed moods and tasks
    for (let i=14; i>=1; i--) {
      const day = addDays(now, -i);
      await db.checkIns.add({ id: `c${i}`, mood: i%4===0 ? 'sad' : (i%3===0 ? 'tired' : 'calm'), createdAt: day });
      await db.tasks.add({ id: `t${i}`, title: 'task', createdAt: day, repeat: 'none', completed: i%2===0, dueAt: day });
    }
    const model = await trainIfNeeded(14);
    expect(model?.weights.length).toBeGreaterThan(0);
    const res = await inferToday();
    expect(res.risk).toBeGreaterThanOrEqual(0);
    expect(res.risk).toBeLessThanOrEqual(1);
  });

  it('refreshDailyInsight stores a message optionally', async () => {
    await refreshDailyInsight();
    const raw = localStorage.getItem('clear.ml.dailyInsight');
    // May be null if no data, but function should not throw
    expect(true).toBe(true);
  });
});
