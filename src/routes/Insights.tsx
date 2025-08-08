import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { summarizeMood, analyzeJournals, mergeInsights } from '../utils/insights';
import { hasKey } from '../utils/cryptoKey';

export default function Insights() {
  const checkIns = useAppStore((s) => s.checkIns);
  const journals = useAppStore((s) => s.journals);
  const getPlain = useAppStore((s) => s.getDecryptedJournalText);
  const [decrypted, setDecrypted] = useState<any[]>([]);

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

  const ins = useMemo(() => mergeInsights(summarizeMood(checkIns), analyzeJournals(decrypted as any)), [checkIns, decrypted]);
  return (
    <section>
      <h2>Gentle Insights</h2>
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
