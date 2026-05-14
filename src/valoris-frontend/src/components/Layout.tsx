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
            <NavLink key={d.id} to={`/strategie/${d.id}`} className={({ isActive }) => `sidebar-domein-link${isActive ? ' active' : ''}`}>
              {d.naam}
            </NavLink>
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
