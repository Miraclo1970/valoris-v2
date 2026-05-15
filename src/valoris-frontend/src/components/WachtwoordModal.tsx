import { useState } from 'react';
import { Modal } from './Modal';
import { wijzigEigenWachtwoord } from '../api/client';

interface Props {
  onClose: () => void;
}

export function WachtwoordModal({ onClose }: Props) {
  const [huidig, setHuidig] = useState('');
  const [nieuw, setNieuw] = useState('');
  const [bevestig, setBevestig] = useState('');
  const [saving, setSaving] = useState(false);
  const [fout, setFout] = useState('');
  const [gelukt, setGelukt] = useState(false);

  const save = async () => {
    setFout('');
    if (nieuw !== bevestig) { setFout('Nieuw wachtwoord en bevestiging komen niet overeen.'); return; }
    if (nieuw.length < 8) { setFout('Nieuw wachtwoord moet minimaal 8 tekens bevatten.'); return; }
    setSaving(true);
    try {
      await wijzigEigenWachtwoord(huidig, nieuw);
      setGelukt(true);
    } catch (e: unknown) {
      const msg = (e as { fout?: string })?.fout ?? 'Opslaan mislukt.';
      setFout(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Wachtwoord wijzigen" onClose={onClose}>
      {gelukt ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <p style={{ margin: 0, fontWeight: 600 }}>Wachtwoord gewijzigd.</p>
          <button className="btn-primary" onClick={onClose}>Sluiten</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Huidig wachtwoord
            <input
              type="password"
              value={huidig}
              onChange={e => setHuidig(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 4, outline: 'none' }}
              autoFocus
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Nieuw wachtwoord
            <input
              type="password"
              value={nieuw}
              onChange={e => setNieuw(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 4, outline: 'none' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Bevestig nieuw wachtwoord
            <input
              type="password"
              value={bevestig}
              onChange={e => setBevestig(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 13, border: '1px solid var(--color-border)', borderRadius: 4, outline: 'none' }}
              onKeyDown={e => e.key === 'Enter' && save()}
            />
          </label>
          {fout && (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--color-danger)', background: 'var(--color-danger-light)', padding: '6px 10px', borderRadius: 4 }}>
              {fout}
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn-secondary" onClick={onClose}>Annuleren</button>
            <button
              className="btn-primary"
              onClick={save}
              disabled={saving || !huidig || !nieuw || !bevestig}
            >
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
