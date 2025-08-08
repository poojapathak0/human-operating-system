import { useState } from 'react';
import { useI18n } from '../utils/i18n';
import { setPassphrase, unlock, lock, hasKey } from '../utils/cryptoKey';
import { exportEncryptedWithKey, importEncryptedWithKey } from '../db/db';

export default function Settings() {
  const t = useI18n();
  const [unlocked, setUnlocked] = useState(hasKey());

  async function onSetPassphrase() {
    const pass = prompt('Set a passphrase (remember it!)') || '';
    if (!pass) return;
    await setPassphrase(pass);
    setUnlocked(true);
    alert('Passphrase set for this session. You must unlock again after reload.');
  }

  async function onUnlock() {
    const pass = prompt('Enter passphrase to unlock') || '';
    if (!pass) return;
    await unlock(pass);
    setUnlocked(true);
  }

  async function onLock() {
    lock();
    setUnlocked(false);
  }

  async function onExport() {
    try {
      const blob = await exportEncryptedWithKey();
      await navigator.clipboard.writeText(blob);
      alert('Encrypted backup copied to clipboard. Keep it safe.');
    } catch (e: any) {
      alert(e.message || 'Export failed');
    }
  }

  async function onImport() {
    try {
      const blob = prompt('Paste your encrypted backup') || '';
      if (!blob) return;
      await importEncryptedWithKey(blob);
      alert('Imported successfully');
    } catch (e: any) {
      alert(e.message || 'Import failed');
    }
  }

  return (
    <section>
      <h2>Settings</h2>
      <div className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={onSetPassphrase}>Set/Change Passphrase</button>
        {unlocked ? (
          <button onClick={onLock}>Lock</button>
        ) : (
          <button onClick={onUnlock}>Unlock</button>
        )}
        <button onClick={onExport} disabled={!unlocked}>Export Encrypted Backup</button>
        <button onClick={onImport} disabled={!unlocked}>Import Encrypted Backup</button>
      </div>
      <p>
        All your data stays on this device. A passphrase encrypts journals and backups. Don’t lose it —
        there’s no recovery.
      </p>
    </section>
  );
}
