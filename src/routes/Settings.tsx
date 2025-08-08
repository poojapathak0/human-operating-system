import { useState, useEffect, useRef } from 'react';
import Modal from '../components/Modal';
import { useI18n, setLanguage } from '../utils/i18n';
import { setPassphrase, unlock, lock, hasKey } from '../utils/cryptoKey';
import { exportEncryptedWithKey, importEncryptedWithKey } from '../db/db';

export default function Settings() {
  const t = useI18n();
  const [unlocked, setUnlocked] = useState(hasKey());
  const [lang, setLang] = useState<'en' | 'hi'>((localStorage.getItem('clear.lng') as any) || 'en');
  const [largeText, setLargeText] = useState(localStorage.getItem('clear.textLg') === '1');
  const [speech, setSpeech] = useState(localStorage.getItem('clear.speech') === '1');
  const [showPassModal, setShowPassModal] = useState<'set' | 'unlock' | null>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.style.fontSize = largeText ? '18px' : '16px';
  }, [largeText]);

  async function onSetPassphrase(pass: string) {
    if (!pass) return;
    await setPassphrase(pass);
    setUnlocked(true);
  }
  async function onUnlock(pass: string) {
    if (!pass) return;
    await unlock(pass);
    setUnlocked(true);
  }
  function onLock() { lock(); setUnlocked(false); }

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
            const v = (e.target.value as 'en' | 'hi');
            setLang(v);
            setLanguage(v);
          }}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
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
        </ul>
      </div>

      <Modal title={showPassModal === 'set' ? 'Set/Change Passphrase' : 'Unlock'} open={!!showPassModal} onClose={() => setShowPassModal(null)}
        actions={
          <>
            <button onClick={() => setShowPassModal(null)}>Cancel</button>
            <button onClick={async () => {
              const v = passRef.current?.value || '';
              if (showPassModal === 'set') await onSetPassphrase(v); else await onUnlock(v);
              setShowPassModal(null);
            }}>Confirm</button>
          </>
        }
      >
        <input ref={passRef} type="password" placeholder="Enter passphrase" style={{ width: '100%' }} />
        {showPassModal === 'set' && <small>Remember your passphrase. There is no recovery.</small>}
      </Modal>
    </section>
  );
}
