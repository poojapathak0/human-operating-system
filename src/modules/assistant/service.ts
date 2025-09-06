import { collectData } from '../ml/service';
import { buildMindMap } from '../mindmap/service';

export async function answer(query: string): Promise<string> {
  const q = query.toLowerCase();
  const ctx = await collectData();
  const days = 14;
  const recent = ctx.checkIns.slice(-days);
  const happy = recent.filter(c=>c.mood==='happy').length;
  const low = recent.filter(c=>c.mood==='sad' || c.mood==='tired').length;
  const tasksDone = ctx.tasks.filter(t=>t.completed).length;
  const tasksTotal = ctx.tasks.length;
  const compl = tasksTotal ? tasksDone / tasksTotal : 0;

  // Simple intents (local-only)
  if (/mood|feel/i.test(q)) {
    return `In the last ${days} days, you logged ${happy} higher moods and ${low} lower moods. Consider a small self‑care action if today feels heavy.`;
  }
  if (/habit|task|productiv/i.test(q)) {
    return `Your overall completion is ${(compl*100).toFixed(0)}%. A tiny task (1–2 minutes) can restart momentum.`;
  }
  if (/cycle|pms|period/i.test(q)) {
    return `Cycle effects can modulate mood. If applicable, be gentle with yourself around the PMS window.`;
  }
  if (/sleep/i.test(q)) {
    return `Short sleep often correlates with lower mood. A 10‑minute rest or earlier wind‑down may help.`;
  }

  // Mind map highlight
  const map = await buildMindMap(30);
  const top = map.edges.slice().sort((a,b)=>Math.abs(b.weight)-Math.abs(a.weight))[0];
  if (top) {
    const label = map.nodes.find(n=>n.id===top.target)?.label || top.target;
    const sign = top.weight >= 0 ? 'positive' : 'negative';
    return `Top correlation with mood is ${sign} for “${label}” at ${top.weight.toFixed(2)} (local estimate). Consider small adjustments there.`;
  }
  return 'I looked at your recent patterns locally. Try asking about mood, habits, sleep, or cycles.';
}
