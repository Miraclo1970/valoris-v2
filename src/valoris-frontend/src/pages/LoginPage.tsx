import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth, type Rol } from '../components/AuthContext';
import { login as apiLogin } from '../api/client';
import '../styles/global.css';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBezig(true); setFout('');
    try {
      const data = await apiLogin(email, wachtwoord);
      login({ id: data.id, naam: data.naam, email: data.email, rollen: data.rollen as { domeinId: number; rol: Rol }[] });
      navigate('/');
    } catch {
      setFout('Onbekend e-mailadres of wachtwoord.');
    } finally { setBezig(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-10)', width: 360, boxShadow: 'var(--shadow)' }}>
        <h1 style={{ marginBottom: 'var(--space-6)', color: 'var(--color-primary)' }}>Valoris</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="email">E-mailadres</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-row">
            <label htmlFor="wachtwoord">Wachtwoord</label>
            <input id="wachtwoord" type="password" value={wachtwoord} onChange={e => setWachtwoord(e.target.value)} required />
          </div>
          {fout && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{fout}</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: 'var(--space-3)' }} disabled={bezig}>
            {bezig ? 'Bezig…' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}
