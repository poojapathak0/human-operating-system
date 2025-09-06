import { collectData } from '../ml/service';
import { buildDailyFeatureVector } from '../ml/features';

export type MMNode = { id: string; label: string };
export type MMEdge = { source: string; target: string; weight: number }; // -1..1
export type MMGraph = { nodes: MMNode[]; edges: MMEdge[] };

function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const xs = x.slice(-n); const ys = y.slice(-n);
  const mx = xs.reduce((a,b)=>a+b,0)/n; const my = ys.reduce((a,b)=>a+b,0)/n;
  let num=0, dx=0, dy=0;
  for (let i=0;i<n;i++){ const vx=xs[i]-mx, vy=ys[i]-my; num+=vx*vy; dx+=vx*vx; dy+=vy*vy; }
  const den = Math.sqrt(dx*dy);
  return den === 0 ? 0 : Math.max(-1, Math.min(1, num/den));
}

export async function buildMindMap(days = 30): Promise<MMGraph> {
  const ctx = await collectData();
  const now = Date.now();
  const series: Record<string, number[]> = {
    moodToday: [], moodAvg7: [], compl7: [], sleepYesterday: [], sleepAvg7: [], cycleProx: [], stressFlag: [], contentFlag: []
  };
  for (let d = days; d >= 1; d--) {
    const ts = new Date(now); ts.setDate(ts.getDate() - d);
    const { meta } = buildDailyFeatureVector(ctx, ts.getTime());
    // push numeric values; cast booleans to 0/1
    series.moodToday.push(Number(meta.moodToday || 0));
    series.moodAvg7.push(Number(meta.moodAvg7 || 0));
    series.compl7.push(Number(meta.compl7 || 0));
    series.sleepYesterday.push(Number(meta.sleepYesterday || 0));
    series.sleepAvg7.push(Number(meta.sleepAvg7 || 0));
    series.cycleProx.push(Number(meta.cycleProx || 0));
    series.stressFlag.push(meta.stressFlag ? 1 : 0);
    series.contentFlag.push(meta.contentFlag ? 1 : 0);
  }
  const nodes: MMNode[] = [
    { id: 'moodToday', label: 'Mood' },
    { id: 'compl7', label: 'Tasks' },
    { id: 'sleepYesterday', label: 'Sleep (yesterday)' },
    { id: 'sleepAvg7', label: 'Sleep (7d)' },
    { id: 'cycleProx', label: 'Cycle proximity' },
    { id: 'contentFlag', label: 'Content load' },
    { id: 'stressFlag', label: 'Stress cues' },
  ];
  const edges: MMEdge[] = [];
  const factors = nodes.filter(n => n.id !== 'moodToday');
  for (const f of factors) {
    const w = pearson(series.moodToday, series[f.id] as number[]);
    edges.push({ source: 'moodToday', target: f.id, weight: w });
  }
  return { nodes, edges };
}
