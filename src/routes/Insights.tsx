import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { summarizeMood, analyzeJournals, mergeInsights } from '../utils/insights';
import { hasKey } from '../utils/cryptoKey';
// Defer ML service until needed to keep main bundle small
let explainToday: any, refreshDailyInsight: any, loadLatestInsight: any;
import { generateNudges } from '../modules/nudges/service';
import { generatePrompts } from '../modules/prompts/service';

export default function Insights() {
  const checkIns = useAppStore((s) => s.checkIns);
  const journals = useAppStore((s) => s.journals);
  const getPlain = useAppStore((s) => s.getDecryptedJournalText);
  const [decrypted, setDecrypted] = useState<any[]>([]);
  const [enabled] = useState(localStorage.getItem('clear.localML') === '1');
  const [mlItems, setMlItems] = useState<Array<{ key: string; label: string; value: number; weight: number; contribution: number; hint?: string }>>([]);
  const [mlRisk, setMlRisk] = useState<number | null>(null);
  const [mlMsg, setMlMsg] = useState<string | null>(null);
  const [nudges, setNudges] = useState<Array<{ id: string; title: string; detail?: string }>>([]);
  const [prompts, setPrompts] = useState<Array<{ id: string; text: string }>>([]);
  const [mlLoading, setMlLoading] = useState(false);
  const [showExplain, setShowExplain] = useState(localStorage.getItem('clear.mlExplain') === '1');

  useEffect(() => {
    const allowed = localStorage.getItem('clear.allowInsightRead') === '1';
    if (!allowed || !hasKey()) { setDecrypted(journals.map((j) => ({ ...j, plain: '' }))); return; }
    (async () => {
      const arr: any[] = [];
      for (const j of journals) {
        try {
          const plain = await getPlain(j);
          arr.push({ ...j, plain });
        } catch {
          arr.push({ ...j, plain: '' });
        }
      }
      setDecrypted(arr);
    })();
  }, [journals, getPlain]);

  useEffect(() => {
    if (!enabled) return;
    (async () => {
      if (!explainToday) {
        const mod = await import('../modules/ml/service');
        explainToday = mod.explainToday; refreshDailyInsight = mod.refreshDailyInsight; loadLatestInsight = mod.loadLatestInsight;
      }
      setMlLoading(true);
      try {
        await refreshDailyInsight();
        const expl = await explainToday();
        if (expl) { setMlItems(expl.items); setMlRisk(expl.risk); }
        const last = loadLatestInsight();
        if (last?.message) setMlMsg(last.message);
        const n = await generateNudges(); setNudges(n);
        const p = await generatePrompts(); setPrompts(p);
      } finally {
        setMlLoading(false);
      }
    })();
  }, [enabled, checkIns]);

  const ins = useMemo(() => mergeInsights(summarizeMood(checkIns), analyzeJournals(decrypted as any)), [checkIns, decrypted]);
  return (
    <section>
      <h2>Gentle Insights</h2>
      {enabled ? (
        <div className="card" role="status" aria-live="polite">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <strong>Today</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {mlRisk !== null && <small style={{ opacity: 0.7 }}>Risk: {mlRisk.toFixed(2)}</small>}
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  setMlLoading(true);
                  try {
                    await refreshDailyInsight();
                    const expl = await explainToday();
                    if (expl) { setMlItems(expl.items); setMlRisk(expl.risk); }
                    const last = loadLatestInsight();
                    if (last?.message) setMlMsg(last.message);
                  } finally {
                    setMlLoading(false);
                  }
                }}
                disabled={mlLoading}
                aria-busy={mlLoading}
                aria-label="Recalculate insights"
                title="Recalculate insights"
              >{mlLoading ? 'Calculating…' : 'Recalculate'}</button>
            </div>
          </div>
          {mlMsg && <div style={{ marginTop: 6 }}>{mlMsg}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <input
              id="explain-factors"
              type="checkbox"
              checked={showExplain}
              onChange={(e) => {
                const v = e.target.checked; setShowExplain(v); localStorage.setItem('clear.mlExplain', v ? '1' : '0');
              }}
              style={{ accentColor: 'var(--brand-500)' }}
            />
            <label htmlFor="explain-factors">Explain contributing factors</label>
          </div>
        </div>
      ) : (
        <div className="card"><small>Local insights are off. Enable them in Settings. Data never leaves your device.</small></div>
      )}

      {enabled && showExplain && (
        <div className="card card-premium">
          <h3 style={{ marginTop: 0 }}>Main contributing factors</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {mlItems.slice(0, 5).map((it) => (
              <div key={it.key} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{it.label}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{it.hint}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)' }}>value: {Number((it as any).value ?? 0).toFixed(2)}</div>
                  <div style={{ fontFamily: 'var(--font-mono)' }}>impact: {it.contribution.toFixed(3)}</div>
                </div>
              </div>
            ))}
            {mlItems.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Not enough recent data yet. Try logging a few check-ins and tasks.</div>}
          </div>
        </div>
      )}

      {enabled && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Cognitive nudges</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {nudges.map(n => <li key={n.id}><strong>{n.title}</strong>{n.detail ? <span style={{ opacity: 0.8 }}>&nbsp;— {n.detail}</span> : null}</li>)}
            {nudges.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No nudges right now.</li>}
          </ul>
        </div>
      )}

      {enabled && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Reflective prompts</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {prompts.map(p => <li key={p.id}>{p.text}</li>)}
            {prompts.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No prompts yet.</li>}
          </ul>
        </div>
      )}
      {ins.length === 0 ? <p>No insights yet. Add a few check-ins and journal entries.</p> : (
        <ul>
          {ins.map((i) => (
            <li key={i.id} className="card"><strong>{i.title}</strong>{i.detail ? <div style={{opacity:0.8}}>{i.detail}</div> : null}</li>
          ))}
        </ul>
      )}
  <p style={{marginTop:12, opacity:0.7}}>Local-only. No cloud, no tracking. To include journal writing tone, enable the option in Vault for local insights to read decrypted entries in memory.</p>
    </section>
  );
}
