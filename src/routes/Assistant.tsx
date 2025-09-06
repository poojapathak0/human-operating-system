import { useState } from 'react';
import { answer } from '../modules/assistant/service';

export default function Assistant() {
  const enabled = localStorage.getItem('clear.localML') === '1';
  const [q, setQ] = useState('How have my moods and tasks been?');
  const [a, setA] = useState<string>('');
  const [busy, setBusy] = useState(false);
  if (!enabled) return <section className="section-premium"><div className="card">Enable Local insights in Settings to use the offline assistant.</div></section>;
  return (
    <section className="section-premium">
      <div className="header-premium">
        <div style={{ fontSize: '2rem' }}>💬</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Assistant (local)</div>
        <div style={{ color: 'var(--text-secondary)' }}>Ask about your moods, habits, or patterns. Answers are computed on-device.</div>
      </div>
      <div className="card card-premium" style={{ display: 'grid', gap: 8 }}>
        <input className="input-premium" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Ask a question…" />
        <button className="btn btn-primary" style={{ background: 'var(--brand-gradient)' }} onClick={async()=>{ setBusy(true); setA(''); try { setA(await answer(q)); } finally { setBusy(false);} }}>Ask</button>
      </div>
      {busy && <div className="card">Thinking locally…</div>}
      {a && (
        <div className="card">
          <strong>Answer</strong>
          <p style={{ marginTop: 6 }}>{a}</p>
          <small>Private and offline. No data leaves your device.</small>
        </div>
      )}
    </section>
  );
}
