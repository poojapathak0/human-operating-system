import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { setLanguage } from '../utils/i18n';
import { autoUnlockFromSession } from '../utils/cryptoKey';
import Onboarding from '../components/Onboarding';

export default function App() {
  const { pathname } = useLocation();
  const hydrate = useAppStore((s) => s.hydrateFromDb);

  useEffect(() => {
    (async () => {
      await autoUnlockFromSession();
      hydrate();
    })();
  }, [hydrate]);

  useEffect(() => {
    const large = localStorage.getItem('clear.textLg') === '1';
    document.documentElement.style.fontSize = large ? '18px' : '16px';
    const hc = localStorage.getItem('clear.hc') === '1';
    document.documentElement.dataset.hc = hc ? '1' : '0';
    const rm = localStorage.getItem('clear.rm') === '1';
    document.documentElement.dataset.rm = rm ? '1' : '0';
  const theme = localStorage.getItem('clear.theme');
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : '';
  }, []);

  return (
    <div className="container">
      <header className="appHeader">
        <h1>Clear</h1>
        <nav>
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Check-In</Link>
          <Link to="/timeline" className={pathname === '/timeline' ? 'active' : ''}>Timeline</Link>
          <Link to="/compass" className={pathname === '/compass' ? 'active' : ''}>Compass</Link>
          <Link to="/insights" className={pathname === '/insights' ? 'active' : ''}>Insights</Link>
          <Link to="/sync" className={pathname === '/sync' ? 'active' : ''}>Sync</Link>
          <Link to="/safety" className={pathname === '/safety' ? 'active' : ''}>Safety</Link>
          <Link to="/vault" className={pathname === '/vault' ? 'active' : ''}>Vault</Link>
          <Link to="/settings" className={pathname === '/settings' ? 'active' : ''}>Settings</Link>
          <button
            className="micBtn"
            aria-label="Switch language"
            onClick={() => {
              const cur = (localStorage.getItem('clear.lng') || 'en') as any;
              const next = cur === 'en' ? 'hi' : cur === 'hi' ? 'es' : 'en';
              setLanguage(next as any);
            }}
          >🌐</button>
        </nav>
      </header>
      <main>
        <Onboarding />
        <Outlet />
      </main>
      <footer className="appFooter">
        <small>Privacy-first. Offline. No ads.</small>
      </footer>
    </div>
  );
}
