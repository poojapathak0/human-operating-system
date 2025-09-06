import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export default function PWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const updateFn = useRef<((reloadPage?: boolean | undefined) => Promise<void>) | null>(null);

  useEffect(() => {
    updateFn.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });
  }, []);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="card"
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{ fontWeight: 600 }}>
        {needRefresh ? 'A new version is available.' : 'App is ready to work offline.'}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {needRefresh ? (
          <button
            onClick={() => updateFn.current?.(true)}
            className="primary"
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              background: 'var(--brand-gradient)',
              color: 'white',
              fontWeight: 700,
            }}
          >
            Update
          </button>
        ) : null}
        <button
          onClick={() => {
            setNeedRefresh(false);
            setOfflineReady(false);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 12,
            border: '1px solid var(--glass-border)',
            background: 'var(--surface-elevated)',
            cursor: 'pointer',
            color: 'var(--text-secondary)'
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
