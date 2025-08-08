import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useI18n } from '../utils/i18n';
import { hasKey, unlock, lock } from '../utils/cryptoKey';

export default function Vault() {
  const t = useI18n();
  const { addJournal, journals, getDecryptedJournalText } = useAppStore((s) => ({
    addJournal: s.addJournal,
    journals: s.journals,
    getDecryptedJournalText: s.getDecryptedJournalText
  }));
  const [text, setText] = useState('');
  const [unlocked, setUnlocked] = useState(hasKey());
  const [plainTexts, setPlainTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!unlocked) return;
    (async () => {
      const map: Record<string, string> = {};
      for (const j of journals) {
        try {
          map[j.id] = await getDecryptedJournalText(j);
        } catch {
          map[j.id] = t('vault.locked');
        }
      }
      setPlainTexts(map);
    })();
  }, [journals, unlocked, getDecryptedJournalText, t]);

  return (
    <section>
      <h2>{t('vault.title')}</h2>

      <div className="card" style={{ display: 'flex', gap: 8 }}>
        {unlocked ? (
          <>
            <button onClick={() => { lock(); setUnlocked(false); }}>{t('vault.lock')}</button>
            <span>{t('vault.unlocked')}</span>
          </>
        ) : (
          <button
            onClick={async () => {
              const pass = prompt(t('vault.enter_passphrase')) || '';
              if (!pass) return;
              await unlock(pass);
              setUnlocked(true);
            }}
          >
            {t('vault.unlock')}
          </button>
        )}
      </div>

      <div className="card">
        <textarea
          placeholder={t('vault.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          disabled={!unlocked}
        />
        <button
          disabled={!unlocked}
          onClick={async () => {
            if (!text.trim()) return;
            await addJournal({ text, createdAt: Date.now() });
            setText('');
          }}
        >
          {t('common.save')}
        </button>
      </div>

      <ul className="list">
        {journals
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((j) => (
            <li key={j.id} className="card">
              <div className="row">
                <small>{new Date(j.createdAt).toLocaleString()}</small>
              </div>
              <p>{unlocked ? (plainTexts[j.id] ?? t('vault.loading')) : t('vault.locked')}</p>
            </li>
          ))}
      </ul>
    </section>
  );
}
