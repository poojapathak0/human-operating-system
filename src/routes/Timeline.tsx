import { useAppStore, CheckIn } from '../store/appStore';
import { useI18n } from '../utils/i18n';

export default function Timeline() {
  const t = useI18n();
  const checkIns = useAppStore((s) => s.checkIns);

  const counts = checkIns.reduce<Record<string, number>>((acc: Record<string, number>, c: CheckIn) => {
    acc[c.mood] = (acc[c.mood] || 0) + 1;
    return acc;
  }, {});
  const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = checkIns.filter((c: CheckIn) => c.createdAt >= lastWeek);
  const scoreMap: Record<string, number> = { sad: 1, tired: 2, neutral: 3, calm: 4, happy: 5 };
  const avg = recent.length
    ? (recent.reduce((s: number, c: CheckIn) => s + (scoreMap[c.mood] || 3), 0) / recent.length).toFixed(1)
    : '—';

  return (
    <section>
      <h2>{t('timeline.title')}</h2>
      <div className="card" aria-live="polite">
        <strong>Insights</strong>
        <div className="row">
          <span>Last 7 days avg mood: {avg}</span>
          <span>Totals — {Object.entries(counts).map(([m, n]) => `${t(`mood.${m}`)}: ${n}`).join(' · ')}</span>
        </div>
      </div>
      <ul className="list">
        {checkIns
          .slice()
          .sort((a: CheckIn, b: CheckIn) => b.createdAt - a.createdAt)
          .map((ci: CheckIn) => (
            <li key={ci.id} className={`card mood-${ci.mood}`}>
              <div className="row">
                <strong>{t(`mood.${ci.mood}`)}</strong>
                <small>{new Date(ci.createdAt).toLocaleString()}</small>
              </div>
              {ci.notes && <p>{ci.notes}</p>}
            </li>
          ))}
      </ul>
    </section>
  );
}
