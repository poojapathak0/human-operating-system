import { useAppStore } from '../store/appStore';
import { useI18n } from '../utils/i18n';

export default function Timeline() {
  const t = useI18n();
  const checkIns = useAppStore((s) => s.checkIns);

  return (
    <section>
      <h2>{t('timeline.title')}</h2>
      <ul className="list">
        {checkIns
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((ci) => (
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
