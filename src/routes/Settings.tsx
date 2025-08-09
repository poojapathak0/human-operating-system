import { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modal';
import { useI18n, setLanguage } from '../utils/i18n';
import { setPassphrase, unlock, lock, hasKey, setSessionPassphrase } from '../utils/cryptoKey';
import { exportEncryptedWithKey, importEncryptedWithKey } from '../db/db';

export default function Settings() {
  const t = useI18n();
  const [unlocked, setUnlocked] = useState(hasKey());
  const [lang, setLang] = useState<'en' | 'hi' | 'es'>((localStorage.getItem('clear.lng') as any) || 'en');
  const [largeText, setLargeText] = useState(localStorage.getItem('clear.textLg') === '1');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('clear.hc') === '1');
  const [reduceMotion, setReduceMotion] = useState(localStorage.getItem('clear.rm') === '1');
  const [dark, setDark] = useState(localStorage.getItem('clear.theme') === 'dark');
  const [speech, setSpeech] = useState(localStorage.getItem('clear.speech') === '1');
  const [notifications, setNotifications] = useState(localStorage.getItem('clear.notifications') === '1');
  const [showPassModal, setShowPassModal] = useState<'set' | 'unlock' | null>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const passConfirmRef = useRef<HTMLInputElement>(null);
  const rememberRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.style.fontSize = largeText ? '18px' : '16px';
  }, [largeText]);
  useEffect(() => {
    document.documentElement.dataset.hc = highContrast ? '1' : '0';
  }, [highContrast]);
  useEffect(() => {
    document.documentElement.dataset.rm = reduceMotion ? '1' : '0';
  }, [reduceMotion]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : '';
  }, [dark]);

  function strengthHint(pw: string) {
    let score = 0;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return ['weak', 'fair', 'good', 'strong'][Math.min(score, 3)];
  }

  async function onSetPassphrase(pass: string, remember: boolean) {
    if (!pass) return;
    await setPassphrase(pass);
    setUnlocked(true);
    setSessionPassphrase(remember ? pass : null);
  }
  async function onUnlock(pass: string, remember: boolean) {
    if (!pass) return;
    await unlock(pass);
    setUnlocked(true);
    setSessionPassphrase(remember ? pass : null);
  }
  function onLock() { setSessionPassphrase(null); lock(); setUnlocked(false); }

  async function onExportFile() {
    try {
      const blobTxt = await exportEncryptedWithKey();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([blobTxt], { type: 'text/plain' }));
      link.download = `clear-backup-${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
    } catch (err) {
      alert('Export failed: ' + err);
    }
  }
  async function onImportFile(file: File) {
    try {
      const txt = await file.text();
      await importEncryptedWithKey(txt);
      window.location.reload();
    } catch (err) {
      alert('Import failed: ' + err);
    }
  }

  return (
    <section className="section-premium">
      <div className="header-premium">
        <div style={{
          fontSize: '2.5rem',
          marginBottom: 'var(--space-sm)',
          filter: 'drop-shadow(0 2px 8px var(--brand-500))'
        }}>
          ⚙️
        </div>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          background: 'var(--brand-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 'var(--space-sm)'
        }}>
          Settings
        </div>
        <div style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          Customize your experience and manage your security
        </div>
      </div>

      <div className="card card-premium">
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          marginBottom: 'var(--space-lg)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          🔐 Security & Backup
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)'
        }}>
          <button 
            className="btn btn-primary"
            onClick={() => setShowPassModal('set')}
            style={{ background: 'var(--brand-gradient)' }}
          >
            Set/Change Passphrase
          </button>
          {unlocked ? (
            <button 
              className="btn btn-secondary"
              onClick={onLock}
              style={{ background: 'var(--surface-glass)' }}
            >
              🔒 Lock
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={() => setShowPassModal('unlock')}
              style={{ background: 'var(--brand-gradient)' }}
            >
              🔓 Unlock
            </button>
          )}
          <button 
            className="btn btn-secondary"
            onClick={onExportFile} 
            disabled={!unlocked}
            style={{ 
              background: unlocked ? 'var(--surface-glass)' : 'var(--surface-disabled)',
              opacity: unlocked ? 1 : 0.5
            }}
          >
            📤 Export Backup
          </button>
          <input ref={fileRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportFile(f);
          }} />
          <button 
            className="btn btn-secondary"
            onClick={() => fileRef.current?.click()} 
            disabled={!unlocked}
            style={{ 
              background: unlocked ? 'var(--surface-glass)' : 'var(--surface-disabled)',
              opacity: unlocked ? 1 : 0.5
            }}
          >
            📥 Import Backup
          </button>
        </div>
      </div>

      <div className="card card-premium">
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          marginBottom: 'var(--space-lg)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          🌐 Language & Accessibility
        </h3>
        
        <div className="settings-grid">
          <div className="setting-item">
            <label className="label-premium">🌍 Language</label>
            <select
              className="input-premium"
              value={lang}
              onChange={(e) => {
                const v = (e.target.value as 'en' | 'hi' | 'es');
                setLang(v);
                setLanguage(v);
              }}
              style={{ background: 'var(--surface-glass)' }}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="es">Español</option>
            </select>
          </div>

          <div className="setting-toggle">
            <input
              id="large-text"
              type="checkbox"
              checked={largeText}
              onChange={(e) => {
                const v = e.target.checked;
                setLargeText(v);
                localStorage.setItem('clear.textLg', v ? '1' : '0');
              }}
              style={{ accentColor: 'var(--brand-500)' }}
            />
            <label htmlFor="large-text" className="toggle-label">
              <span>📏 Large Text</span>
              <small>Increases font size for better readability</small>
            </label>
          </div>

          <div className="setting-toggle">
            <input
              id="high-contrast"
              type="checkbox"
              checked={highContrast}
              onChange={(e) => {
                const v = e.target.checked;
                setHighContrast(v);
                localStorage.setItem('clear.hc', v ? '1' : '0');
              }}
              style={{ accentColor: 'var(--brand-500)' }}
            />
            <label htmlFor="high-contrast" className="toggle-label">
              <span>🎨 High Contrast</span>
              <small>Improves visibility with stronger contrast</small>
            </label>
          </div>

          <div className="setting-toggle">
            <input
              id="reduce-motion"
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => {
                const v = e.target.checked;
                setReduceMotion(v);
                localStorage.setItem('clear.rm', v ? '1' : '0');
              }}
              style={{ accentColor: 'var(--brand-500)' }}
            />
            <label htmlFor="reduce-motion" className="toggle-label">
              <span>🧘 Reduce Motion</span>
              <small>Minimizes animations for comfort</small>
            </label>
          </div>

          <div className="setting-toggle">
            <input
              id="dark-mode"
              type="checkbox"
              checked={dark}
              onChange={(e) => {
                const v = e.target.checked;
                setDark(v);
                localStorage.setItem('clear.theme', v ? 'dark' : 'light');
              }}
              style={{ accentColor: 'var(--brand-500)' }}
            />
            <label htmlFor="dark-mode" className="toggle-label">
              <span>🌙 Dark Mode</span>
              <small>Easy on the eyes in low light</small>
            </label>
          </div>

          <div className="setting-toggle">
            <input
              id="voice-input"
              type="checkbox"
              checked={speech}
              onChange={(e) => {
                const v = e.target.checked;
                setSpeech(v);
                localStorage.setItem('clear.speech', v ? '1' : '0');
              }}
              style={{ accentColor: 'var(--brand-500)' }}
            />
            <label htmlFor="voice-input" className="toggle-label">
              <span>🎤 Voice Input</span>
              <small>Speak instead of typing</small>
            </label>
          </div>

          <div className="setting-toggle">
            <input
              id="notifications"
              type="checkbox"
              checked={notifications}
              onChange={async (e) => {
                const v = e.target.checked;
                if (v) {
                  // Request permission when enabling
                  if ('Notification' in window) {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                      setNotifications(true);
                      localStorage.setItem('clear.notifications', '1');
                      // Start reminder service
                      const { reminderService } = await import('../utils/reminders');
                      reminderService.startIntelligentReminders();
                    } else {
                      alert('Notifications permission denied. Please enable in browser settings.');
                    }
                  } else {
                    alert('This browser does not support notifications.');
                  }
                } else {
                  setNotifications(false);
                  localStorage.setItem('clear.notifications', '0');
                }
              }}
              style={{ accentColor: 'var(--brand-500)' }}
            />
            <label htmlFor="notifications" className="toggle-label">
              <span>🔔 Smart Reminders</span>
              <small>Gentle nudges for check-ins and wellness milestones</small>
            </label>
          </div>
        </div>
      </div>

      <div className="card card-premium">
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          marginBottom: 'var(--space-lg)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          📊 Tracking & Insights
        </h3>
        <div style={{
          padding: 'var(--space-lg)',
          background: 'var(--info-100)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--info-300)',
          marginBottom: 'var(--space-md)'
        }}>
          <h4 style={{ color: 'var(--info-800)', marginBottom: 'var(--space-md)' }}>
            📈 What Clear Tracks for You:
          </h4>
          <div style={{ display: 'grid', gap: 'var(--space-sm)', color: 'var(--info-700)' }}>
            <div>🔥 <strong>Daily Streaks:</strong> Consecutive check-in days</div>
            <div>📊 <strong>Mood Patterns:</strong> 7-day averages and trends</div>
            <div>🎯 <strong>Wellness Metrics:</strong> Total entries and progress</div>
            <div>💡 <strong>Smart Insights:</strong> Automatic pattern recognition</div>
            <div>🏆 <strong>Milestones:</strong> Celebration of your achievements</div>
            <div>🧠 <strong>Intelligent Reminders:</strong> Based on your habits and mood</div>
          </div>
          <div style={{ 
            marginTop: 'var(--space-md)', 
            padding: 'var(--space-md)',
            background: 'var(--success-100)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success-800)',
            fontSize: '0.875rem'
          }}>
            🔒 <strong>Privacy:</strong> All tracking happens locally on your device. No data leaves your phone.
          </div>
        </div>
      </div>

      <div className="card card-premium">
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          marginBottom: 'var(--space-md)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          🆘 Crisis Resources
        </h3>
        <div style={{
          padding: 'var(--space-lg)',
          background: 'var(--warning-100)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--warning-300)',
          marginBottom: 'var(--space-md)'
        }}>
          <p style={{ 
            color: 'var(--warning-800)', 
            fontWeight: '600',
            marginBottom: 'var(--space-md)'
          }}>
            If you're in immediate danger or thinking about harming yourself, please contact local emergency services.
          </p>
          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            <a 
              href="https://findahelpline.com" 
              target="_blank" 
              rel="noreferrer"
              style={{
                color: 'var(--brand-600)',
                textDecoration: 'none',
                fontWeight: '600',
                padding: 'var(--space-sm)',
                background: 'var(--surface-glass)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)'
              }}
            >
              🌐 findahelpline.com
            </a>
            <div style={{ color: 'var(--warning-700)', fontWeight: '500' }}>
              📞 US: 988 Suicide & Crisis Lifeline
            </div>
            <div style={{ color: 'var(--warning-700)', fontWeight: '500' }}>
              📞 India: AASRA +91-9820466726
            </div>
            <a 
              href="/safety"
              style={{
                color: 'var(--brand-600)',
                textDecoration: 'none',
                fontWeight: '600',
                padding: 'var(--space-sm)',
                background: 'var(--surface-glass)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-glass)',
                display: 'inline-block',
                marginTop: 'var(--space-sm)'
              }}
            >
              🛡️ More resources & grounding techniques
            </a>
          </div>
        </div>
      </div>

      <Modal title={showPassModal === 'set' ? 'Set/Change Passphrase' : 'Unlock'} open={!!showPassModal} onClose={() => setShowPassModal(null)}
        actions={
          <>
            <button onClick={() => setShowPassModal(null)}>Cancel</button>
            <button onClick={() => {
              const pass = passRef.current?.value || '';
              const remember = rememberRef.current?.checked || false;
              if (showPassModal === 'set') {
                const confirm = passConfirmRef.current?.value || '';
                if (pass !== confirm) {
                  alert('Passphrases do not match.');
                  return;
                }
                onSetPassphrase(pass, remember);
              } else {
                onUnlock(pass, remember);
              }
              setShowPassModal(null);
            }}>
              {showPassModal === 'set' ? 'Set' : 'Unlock'}
            </button>
          </>
        }
      >
        <label>Passphrase</label>
        <input ref={passRef} type="password" style={{ marginBottom: 8 }} />
        {showPassModal === 'set' && (
          <>
            <label>Confirm Passphrase</label>
            <input ref={passConfirmRef} type="password" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Strength: <span style={{ fontWeight: '600' }}>{strengthHint(passRef.current?.value || '')}</span>
            </p>
          </>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <input ref={rememberRef} type="checkbox" />
          Remember this session
        </label>
      </Modal>
    </section>
  );
}
