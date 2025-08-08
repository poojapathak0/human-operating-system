import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { setLanguage } from '../utils/i18n';

export default function App() {
  const { pathname } = useLocation();
  const hydrate = useAppStore((s) => s.hydrateFromDb);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="container">
      <header className="appHeader">
        <h1>Clear</h1>
        <nav>
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Check-In</Link>
          <Link to="/timeline" className={pathname === '/timeline' ? 'active' : ''}>Timeline</Link>
          <Link to="/compass" className={pathname === '/compass' ? 'active' : ''}>Compass</Link>
          <Link to="/vault" className={pathname === '/vault' ? 'active' : ''}>Vault</Link>
          <Link to="/settings" className={pathname === '/settings' ? 'active' : ''}>Settings</Link>
          <button className="micBtn" onClick={() => setLanguage((localStorage.getItem('clear.lng') || 'en') === 'en' ? 'hi' : 'en')}>🌐</button>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="appFooter">
        <small>Privacy-first. Offline. No ads.</small>
      </footer>
    </div>
  );
}
