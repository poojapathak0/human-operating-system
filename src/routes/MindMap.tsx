import { useEffect, useState } from 'react';
import { buildMindMap, type MMGraph } from '../modules/mindmap/service';

export default function MindMap() {
  const [graph, setGraph] = useState<MMGraph | null>(null);
  const enabled = localStorage.getItem('clear.localML') === '1';

  useEffect(() => {
    if (!enabled) return;
    (async () => setGraph(await buildMindMap(30)))();
  }, [enabled]);

  if (!enabled) return (
    <section className="section-premium"><div className="card">Enable Local insights in Settings to view mind maps.</div></section>
  );
  if (!graph) return (<section className="section-premium"><div className="card">Building mind map…</div></section>);

  // Simple radial layout: Mood at center, factors around
  const center = { x: 300, y: 200 };
  const radius = 120;
  const others = graph.nodes.filter(n=>n.id!=='moodToday');

  return (
    <section className="section-premium">
      <div className="header-premium">
        <div style={{ fontSize: '2rem' }}>🕸️</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Mind Map</div>
        <div style={{ color: 'var(--text-secondary)' }}>Local correlations between mood and daily signals</div>
      </div>
      <div className="card card-premium" style={{ overflow: 'auto' }}>
        <svg width={600} height={380} role="img" aria-label="Mind map of mood correlations">
          {/* center node */}
          <circle cx={center.x} cy={center.y} r={30} fill="url(#g)" stroke="var(--glass-border)" />
          <text x={center.x} y={center.y+4} textAnchor="middle" fontWeight={700}>Mood</text>
          {/* gradient */}
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6b9080" /><stop offset="100%" stopColor="#4a6b5a" />
            </linearGradient>
          </defs>
          {/* edges and factor nodes */}
          {others.map((n, i) => {
            const angle = (i / others.length) * Math.PI * 2;
            const x = center.x + Math.cos(angle) * radius;
            const y = center.y + Math.sin(angle) * radius;
            const edge = graph.edges.find(e=>e.target===n.id);
            const w = edge ? edge.weight : 0;
            const thickness = 1 + Math.abs(w) * 6;
            const color = w >= 0 ? '#7fb069' : '#c17767';
            return (
              <g key={n.id}>
                <line x1={center.x} y1={center.y} x2={x} y2={y} stroke={color} strokeWidth={thickness} opacity={0.8} />
                <circle cx={x} cy={y} r={24} fill="var(--surface-elevated)" stroke="var(--glass-border)" />
                <text x={x} y={y+4} textAnchor="middle" fontSize="12" fontWeight={600}>{n.label}</text>
                {edge && (
                  <text x={(center.x+x)/2} y={(center.y+y)/2 - 6} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
                    {w.toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <small>Color and thickness reflect the strength and sign of correlation (computed locally).</small>
      </div>
    </section>
  );
}
