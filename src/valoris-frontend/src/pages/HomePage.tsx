import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDomeinen, type Domein } from '../api/client';
import { useAuth } from '../components/AuthContext';
import { Card } from '../components/Card';

export function HomePage() {
  const [domeinen, setDomeinen] = useState<Domein[]>([]);
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getDomeinen().then(setDomeinen).catch(() => {});
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-6)' }}>Kies een domein</h1>
      {domeinen.length === 0
        ? <p style={{ color: 'var(--color-text-muted)' }}>Geen domeinen beschikbaar.</p>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {domeinen.map(d => (
              <Card key={d.id} title={d.naam}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                  {d.omschrijving || 'Geen omschrijving.'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <button className="btn-primary" onClick={() => navigate(`/strategie/${d.id}`)}>Strategie bekijken</button>
                  {hasRole('redacteur', d.id) && (
                    <button className="btn-secondary" onClick={() => navigate(`/veranderingen/${d.id}`)}>Veranderingen</button>
                  )}
                  {hasRole('beheerder', d.id) && (
                    <button className="btn-secondary" onClick={() => navigate(`/inrichting/${d.id}`)}>Inrichting</button>
                  )}
                </div>
              </Card>
            ))}
          </div>
      }
    </div>
  );
}
