import { useEffect, useState } from 'react';
import Modal from './Modal';

export default function Onboarding() {
  const [open, setOpen] = useState(() => localStorage.getItem('clear.onboarded') !== '1');

  useEffect(() => {
    if (!open) localStorage.setItem('clear.onboarded', '1');
  }, [open]);

  return (
    <Modal
      title="Welcome to Clear"
      open={open}
      onClose={() => setOpen(false)}
      actions={<button onClick={() => setOpen(false)}>Start</button>}
    >
      <p>Clear is a private, offline-first companion for emotional clarity. No ads. No tracking.</p>
      <ul>
        <li>Check-In: track mood and notes</li>
        <li>Vault: encrypted journaling (set a passphrase in Settings)</li>
        <li>Backups: encrypted export/import</li>
      </ul>
      <small>You’re in control. This data stays on this device unless you export it.</small>
    </Modal>
  );
}
