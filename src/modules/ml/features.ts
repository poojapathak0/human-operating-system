import type { DataContext } from './types';

function dateKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function avg(nums: number[]) { return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : 0; }

// Map mood to ordinal scale for features
const moodScore: Record<string, number> = { sad: 1, tired: 2, neutral: 3, calm: 4, happy: 5 };

export function buildDailyFeatureVector(ctx: DataContext, dayTs = Date.now()): { x: number[]; meta: Record<string, any> } {
  const key = dateKey(dayTs);
  const prev7 = new Array(7).fill(0).map((_,i)=>{
    const d = new Date(dayTs); d.setDate(d.getDate() - (i+1)); return dateKey(d.getTime());
  });

  // Mood stats
  const moodsToday = ctx.checkIns.filter(c => dateKey(c.createdAt) === key);
  const moodAvg7 = avg(prev7.flatMap(k => ctx.checkIns.filter(c=>dateKey(c.createdAt)===k).map(c=>moodScore[c.mood])));
  const moodToday = avg(moodsToday.map(m=>moodScore[m.mood]));

  // Tasks: completion rate last 7 days
  const tasksByDay = new Map<string, { done: number; total: number }>();
  for (const t of ctx.tasks) {
    const k = t.dueAt ? dateKey(t.dueAt) : undefined;
    if (!k) continue;
    const cell = tasksByDay.get(k) || { done: 0, total: 0 };
    cell.total += 1; if (t.completed) cell.done += 1; tasksByDay.set(k, cell);
  }
  const compl7 = avg(prev7.map(k => {
    const c = tasksByDay.get(k); if (!c || c.total===0) return 0; return c.done / c.total; 
  }));

  // Sleep: hours yesterday and 7-day avg (if present)
  let sleepYesterday = 0, sleepAvg7 = 0;
  if (ctx.sleep) {
    const y = new Date(dayTs); y.setDate(y.getDate()-1); const yKey = dateKey(y.getTime());
    sleepYesterday = ctx.sleep.find(s => s.date === yKey)?.hours ?? 0;
    sleepAvg7 = avg(prev7.map(k => ctx.sleep!.find(s => s.date===k)?.hours ?? 0));
  }

  // Cycle proximity (PMS heuristic): days since last period start (0..28 normalized)
  let cycleProx = 0;
  if (ctx.cycles && ctx.cycles.length) {
    const last = ctx.cycles.map(c=>c.date).sort().filter(d => new Date(d).getTime() <= dayTs).pop();
    if (last) {
      const daysSince = Math.floor((dayTs - new Date(last).getTime()) / (24*60*60*1000));
      // map PMS window (~-5..0 before next period) to higher weight; naive 28-day cycle
      const daysToNext = 28 - (daysSince % 28);
      cycleProx = daysToNext <= 5 ? (6 - daysToNext) / 5 : 0; // 0..1
    }
  }

  // Text cues from notes (very lightweight keyword flags)
  const notes = moodsToday.map(c => (c.notes||'').toLowerCase()).join(' ');
  const stressFlag = /stress|overwhelm|anx|panic|pressure|deadline/.test(notes) ? 1 : 0;
  const contentFlag = /doomscroll|social|news|reel|video/.test(notes) ? 1 : 0;

  // Feature vector [bias handled by model]
  const x = [
    moodToday || 0,
    moodAvg7 || 0,
    compl7 || 0,
    sleepYesterday || 0,
    sleepAvg7 || 0,
    cycleProx || 0,
    stressFlag,
    contentFlag,
  ];
  return { x, meta: { key, moodToday, moodAvg7, compl7, sleepYesterday, sleepAvg7, cycleProx, stressFlag, contentFlag } };
}
