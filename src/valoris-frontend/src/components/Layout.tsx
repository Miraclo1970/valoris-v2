import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getDomeinen, type Domein } from '../api/client';
import { useEffect, useState } from 'react';
import { HelpModal } from './HelpModal';
import { WachtwoordModal } from './WachtwoordModal';
import './Layout.css';

export function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [domeinen, setDomeinen] = useState<Domein[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [wachtwoordOpen, setWachtwoordOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getDomeinen().then(setDomeinen).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="shell">
      {/* Mobiel: overlay om sidebar te sluiten */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          Valoris
          <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Sluit menu">✕</button>
        </div>
        <nav className="sidebar-nav" onClick={closeSidebar}>
          {domeinen.map(d => (
            <NavLink key={d.id} to={`/strategie/${d.id}`} className={({ isActive }) => `sidebar-domein-link${isActive ? ' active' : ''}`}>
              {d.naam}
            </NavLink>
          ))}
        </nav>
        {hasRole('beheerder') && (
          <div className="sidebar-beheer" onClick={closeSidebar}>
            <NavLink to="/beheer" className={({ isActive }) => isActive ? 'active' : ''}>⚙ Beheer</NavLink>
          </div>
        )}
        <div className="sidebar-footer">
          <button className="sidebar-help-btn" onClick={() => { setHelpOpen(true); closeSidebar(); }}>? Help</button>
          <button className="sidebar-help-btn" onClick={() => { setWachtwoordOpen(true); closeSidebar(); }}>🔑 Wachtwoord</button>
          <span className="sidebar-user">{user?.naam}</span>
          <button className="btn-secondary" onClick={handleLogout}>Uitloggen</button>
        </div>
      </aside>

      <main className="main-content">
        {/* Mobiel: hamburger knop bovenin */}
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          ☰ Menu
        </button>
        <Outlet />
      </main>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {wachtwoordOpen && <WachtwoordModal onClose={() => setWachtwoordOpen(false)} />}
    </div>
  );
}
