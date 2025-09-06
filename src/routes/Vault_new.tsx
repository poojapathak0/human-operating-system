import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import type { JournalEntry } from '../store/appStore';
import { useI18n } from '../utils/i18n';
import { hasKey, unlock, lock } from '../utils/cryptoKey';

export default function Vault() {
  const t = useI18n();
  const addJournal = useAppStore((s) => s.addJournal);
  const journals = useAppStore((s) => s.journals);
  const getDecryptedJournalText = useAppStore((s) => s.getDecryptedJournalText);
  const [text, setText] = useState('');
  const [unlocked, setUnlocked] = useState(hasKey());
  const [plainTexts, setPlainTexts] = useState<Record<string, string>>({});
  const [allowInsightRead, setAllowInsightRead] = useState(localStorage.getItem('clear.allowInsightRead') === '1');

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
    <section className="section-premium">
      <div className="header-premium">
        <div style={{
          fontSize: '2.5rem',
          marginBottom: 'var(--space-sm)',
          filter: 'drop-shadow(0 2px 8px var(--brand-500))'
        }}>
          🔐
        </div>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          background: 'var(--brand-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 'var(--space-sm)'
        }}>
          {t('vault.title')}
        </div>
        <div style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          Your private sanctuary for thoughts, dreams, and reflections
        </div>
      </div>

      <div className="card card-premium">
        <div style={{ 
          display: 'flex', 
          gap: 'var(--space-md)', 
          alignItems: 'center',
          padding: 'var(--space-lg)',
          background: unlocked ? 'var(--success-gradient)' : 'var(--surface-glass)',
          backdropFilter: 'blur(20px)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-glass)',
          marginBottom: 'var(--space-lg)'
        }}>
          {unlocked ? (
            <>
              <div style={{ fontSize: '24px' }}>✅</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: 'var(--success-600)' }}>
                  {t('vault.unlocked')}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Your vault is ready for new entries
                </div>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => { lock(); setUnlocked(false); }}
                style={{ background: 'var(--surface-glass)' }}
              >
                {t('vault.lock')}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '24px' }}>🔒</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  Vault Locked
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Enter your passphrase to access your private journal
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  const pass = prompt(t('vault.enter_passphrase')) || '';
                  if (!pass) return;
                  await unlock(pass);
                  setUnlocked(true);
                }}
                style={{ background: 'var(--brand-gradient)' }}
              >
                {t('vault.unlock')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card card-premium">
        <div className="form-section">
          <label className="label-premium">
            New Journal Entry
          </label>
          <textarea
            className="input-premium"
            placeholder={t('vault.placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            disabled={!unlocked}
            style={{ 
              minHeight: '200px', 
              resize: 'vertical',
              opacity: unlocked ? 1 : 0.5,
              cursor: unlocked ? 'text' : 'not-allowed'
            }}
          />
          <button
            className="btn btn-primary btn-lg"
            disabled={!unlocked}
            onClick={async () => {
              if (!text.trim()) return;
              await addJournal({ text, createdAt: Date.now() });
              setText('');
            }}
            style={{ 
              width: '100%',
              marginTop: 'var(--space-md)',
              background: unlocked ? 'var(--brand-gradient)' : 'var(--surface-disabled)',
              opacity: unlocked ? 1 : 0.5,
              cursor: unlocked ? 'pointer' : 'not-allowed'
            }}
          >
            {t('common.save')}
          </button>
        </div>
      </div>

      <div className="card card-premium">
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--space-md)',
          padding: 'var(--space-md)',
          background: 'var(--warning-100)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--warning-300)'
        }}>
          <input
            id="allow-insights"
            type="checkbox"
            checked={allowInsightRead}
            onChange={(e) => { 
              const v = e.target.checked; 
              setAllowInsightRead(v); 
              localStorage.setItem('clear.allowInsightRead', v ? '1' : '0'); 
            }}
            style={{
              width: '18px',
              height: '18px',
              accentColor: 'var(--brand-500)'
            }}
          />
          <label htmlFor="allow-insights" style={{
            fontSize: '0.95rem',
            fontWeight: '500',
            color: 'var(--warning-800)',
            cursor: 'pointer'
          }}>
            🔍 Allow local insights to temporarily read decrypted entries (memory only)
          </label>
        </div>
      </div>

      {journals.length > 0 && (
        <div className="card card-premium">
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            marginBottom: 'var(--space-lg)',
            color: 'var(--text-primary)'
          }}>
            Journal Entries ({journals.length})
          </h3>
          <div className="journal-entries">
            {journals
              .slice()
              .sort((a: JournalEntry, b: JournalEntry) => b.createdAt - a.createdAt)
              .map((j: JournalEntry) => (
                <div key={j.id} className="journal-entry">
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-sm)'
                  }}>
                    <small style={{ 
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {new Date(j.createdAt).toLocaleString()}
                    </small>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: unlocked ? 'var(--success-100)' : 'var(--surface-glass)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: unlocked ? 'var(--success-700)' : 'var(--text-secondary)'
                    }}>
                      {unlocked ? 'Unlocked' : 'Encrypted'}
                    </div>
                  </div>
                  <p style={{
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    background: unlocked ? 'transparent' : 'var(--surface-glass)',
                    padding: unlocked ? 'var(--space-md)' : 'var(--space-lg)',
                    borderRadius: 'var(--radius-md)',
                    border: unlocked ? '1px solid var(--border-light)' : '1px solid var(--border-glass)',
                    backdropFilter: unlocked ? 'none' : 'blur(10px)',
                    fontStyle: unlocked ? 'normal' : 'italic',
                    textAlign: unlocked ? 'left' : 'center'
                  }}>
                    {unlocked ? (plainTexts[j.id] ?? t('vault.loading')) : t('vault.locked')}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
