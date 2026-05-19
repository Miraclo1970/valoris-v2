import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getDomeinen, type Domein } from '../api/client';
import { useAuth } from './AuthContext';
import './DomeinLayout.css';

export function DomeinLayout() {
  const { domeinId } = useParams<{ domeinId: string }>();
  const id = parseInt(domeinId!);
  const [domein, setDomein] = useState<Domein | null>(null);
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getDomeinen().then(d => setDomein(d.find(x => x.id === id) ?? null));
  }, [id]);

  return (
    <div className="domein-shell">
      <header className="domein-header">
        <div className="domein-header-left">
          <span className="domein-label">DOMEIN</span>
          <span className="domein-naam">{domein?.naam ?? '…'}</span>
        </div>
        <nav className="domein-tabs">
          {hasRole('beheerder', id) && (
            <NavLink to={`/scope/${id}`} className={({ isActive }) => isActive ? 'tab active' : 'tab'}>
              Scope
            </NavLink>
          )}
          {hasRole('beheerder', id) && (
            <NavLink to={`/inrichting/${id}`} className={({ isActive }) => isActive ? 'tab active' : 'tab'}>
              Inrichting
            </NavLink>
          )}
          {hasRole('redacteur', id) && (
            <NavLink to={`/veranderingen/${id}`} className={({ isActive }) => isActive ? 'tab active' : 'tab'}>
              Veranderingen
            </NavLink>
          )}
          <NavLink to={`/strategie/${id}`} className={({ isActive }) => isActive ? 'tab active' : 'tab'}>
            Strategie
          </NavLink>
        </nav>
        <button className="wissel-btn" onClick={() => navigate('/')}>Wissel domein</button>
      </header>
      <div className="domein-content">
        <Outlet />
      </div>
    </div>
  );
}
