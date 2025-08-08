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
  const [palette, setPalette] = useState<string>(localStorage.getItem('clear.palette') || 'ocean');
  const [speech, setSpeech] = useState(localStorage.getItem('clear.speech') === '1');
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
  useEffect(() => {
    document.documentElement.dataset.palette = palette || '';
  }, [palette]);

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
      const blob = new Blob([blobTxt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clear-backup.txt';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || 'Export failed');
    }
  }
  async function onImportFile(file: File) {
    const text = await file.text();
    await importEncryptedWithKey(text.trim());
    alert('Imported successfully');
  }

  return (
    <section>
      <h2>Settings</h2>
      <div className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setShowPassModal('set')}>Set/Change Passphrase</button>
        {unlocked ? (
          <button onClick={onLock}>Lock</button>
        ) : (
          <button onClick={() => setShowPassModal('unlock')}>Unlock</button>
        )}
        <button onClick={onExportFile} disabled={!unlocked}>Export Encrypted Backup</button>
        <input ref={fileRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImportFile(f);
        }} />
        <button onClick={() => fileRef.current?.click()} disabled={!unlocked}>Import Encrypted Backup</button>
      </div>

      <div className="card" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>Language</label>
        <select
          value={lang}
          onChange={(e) => {
            const v = (e.target.value as 'en' | 'hi' | 'es');
            setLang(v);
            setLanguage(v);
          }}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="es">Español</option>
        </select>

        <label style={{ marginLeft: 16 }}>Large Text</label>
        <input
          type="checkbox"
          checked={largeText}
          onChange={(e) => {
            const v = e.target.checked;
            setLargeText(v);
            localStorage.setItem('clear.textLg', v ? '1' : '0');
          }}
        />

        <label style={{ marginLeft: 16 }}>High Contrast</label>
        <input
          type="checkbox"
          checked={highContrast}
          onChange={(e) => {
            const v = e.target.checked;
            setHighContrast(v);
            localStorage.setItem('clear.hc', v ? '1' : '0');
          }}
        />

        <label style={{ marginLeft: 16 }}>Reduce Motion</label>
        <input
          type="checkbox"
          checked={reduceMotion}
          onChange={(e) => {
            const v = e.target.checked;
            setReduceMotion(v);
            localStorage.setItem('clear.rm', v ? '1' : '0');
          }}
        />

        <label style={{ marginLeft: 16 }}>Dark Mode</label>
        <input
          type="checkbox"
          checked={dark}
          onChange={(e) => {
            const v = e.target.checked;
            setDark(v);
            localStorage.setItem('clear.theme', v ? 'dark' : 'light');
          }}
        />

        <label style={{ marginLeft: 16 }}>Theme</label>
        <select
          value={palette}
          onChange={(e)=>{ const v = e.target.value; setPalette(v); localStorage.setItem('clear.palette', v); }}
        >
          <option value="ocean">Ocean</option>
          <option value="forest">Forest</option>
          <option value="sunset">Sunset</option>
          <option value="lavender">Lavender</option>
        </select>

        <label style={{ marginLeft: 16 }}>Voice Input</label>
        <input
          type="checkbox"
          checked={speech}
          onChange={(e) => {
            const v = e.target.checked;
            setSpeech(v);
            localStorage.setItem('clear.speech', v ? '1' : '0');
          }}
        />
      </div>

      <div className="card">
        <h3>Crisis resources</h3>
        <p>If you’re in immediate danger or thinking about harming yourself, please contact local emergency services. Resources:</p>
        <ul>
          <li><a href="https://findahelpline.com" target="_blank" rel="noreferrer">findahelpline.com</a></li>
          <li>US: 988 Suicide & Crisis Lifeline</li>
          <li>India: AASRA +91-9820466726</li>
          <li><a href="/safety">More resources & grounding</a></li>
        </ul>
      </div>

      <Modal title={showPassModal === 'set' ? 'Set/Change Passphrase' : 'Unlock'} open={!!showPassModal} onClose={() => setShowPassModal(null)}
        actions={
          <>
            <button onClick={() => setShowPassModal(null)}>Cancel</button>
            <button onClick={async () => {
              const v = passRef.current?.value || '';
              const remember = !!rememberRef.current?.checked;
              if (showPassModal === 'set') {
                const c = passConfirmRef.current?.value || '';
                if (v !== c) { alert('Passphrases do not match'); return; }
                await onSetPassphrase(v, remember);
              } else {
                await onUnlock(v, remember);
              }
              setShowPassModal(null);
            }}>Confirm</button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <input ref={passRef} type="password" placeholder="Enter passphrase" style={{ width: '100%' }} />
          {showPassModal === 'set' && (
            <>
              <input ref={passConfirmRef} type="password" placeholder="Confirm passphrase" style={{ width: '100%' }} />
              <small>Strength: {strengthHint(passRef.current?.value || '')}</small>
            </>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input ref={rememberRef} type="checkbox" /> Remember until tab is closed
          </label>
          {showPassModal === 'set' && <small>Remember your passphrase. There is no recovery.</small>}
        </div>
      </Modal>
    </section>
  );
}
