import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getDomeinen, type Domein } from '../api/client';
import { useEffect, useState } from 'react';
import './Layout.css';

export function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [domeinen, setDomeinen] = useState<Domein[]>([]);

  useEffect(() => {
    getDomeinen().then(setDomeinen).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-logo">Valoris</div>
        <nav className="sidebar-nav">
          {domeinen.map(d => (
            <div key={d.id} className="sidebar-domein">
              <span className="sidebar-domein-naam">{d.naam}</span>
              <NavLink to={`/strategie/${d.id}`} className={({ isActive }) => isActive ? 'active' : ''}>Strategie</NavLink>
              {hasRole('redacteur', d.id) && (
                <NavLink to={`/veranderingen/${d.id}`} className={({ isActive }) => isActive ? 'active' : ''}>Veranderingen</NavLink>
              )}
              {hasRole('beheerder', d.id) && (
                <NavLink to={`/inrichting/${d.id}`} className={({ isActive }) => isActive ? 'active' : ''}>Inrichting</NavLink>
              )}
            </div>
          ))}
        </nav>
        {hasRole('beheerder') && (
          <div className="sidebar-beheer">
            <NavLink to="/beheer" className={({ isActive }) => isActive ? 'active' : ''}>⚙ Beheer</NavLink>
          </div>
        )}
        <div className="sidebar-footer">
          <span className="sidebar-user">{user?.naam}</span>
          <button className="btn-secondary" onClick={handleLogout}>Uitloggen</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
