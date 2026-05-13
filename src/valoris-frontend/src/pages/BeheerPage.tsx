import { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import {
  getDomeinen, createDomein, updateDomein,
  getZaaksoorten, createZaaksoort, updateZaaksoort,
  getAlleIndicatoren, createIndicator, updateIndicator,
  getIndicatoren, koppelIndicator, ontkoppelIndicator,
  getAllePeriodes, createPeriode, updatePeriode,
  getGebruikers, createGebruiker, wijzigWachtwoord, koppelRol, ontkoppelRol,
  type Domein, type Zaaksoort, type Indicator, type DomeinIndicator,
  type HuidigePeriode, type DomeinCreate, type ZaaksoortCreate,
  type IndicatorCreate, type PeriodeCreate, type GebruikerDetail,
} from '../api/client';
import './BeheerPage.css';

type Tab = 'domeinen' | 'zaaksoorten' | 'indicatoren' | 'koppelen' | 'periodes' | 'gebruikers';

const TABS: { key: Tab; label: string }[] = [
  { key: 'domeinen',    label: 'Domeinen' },
  { key: 'zaaksoorten', label: 'Zaaksoorten' },
  { key: 'indicatoren', label: 'Indicatoren' },
  { key: 'koppelen',    label: 'Ind. koppelen' },
  { key: 'periodes',    label: 'Periodes' },
  { key: 'gebruikers', label: 'Gebruikers' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function periodeLabel(p: HuidigePeriode) {
  const d = new Date(p.startdatum);
  if (p.type === 'jaar') return `${d.getFullYear()}`;
  if (p.type === 'kwartaal') return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
  return d.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DomeinenTab() {
  const [domeinen, setDomeinen] = useState<Domein[]>([]);
  const [editing, setEditing] = useState<Domein | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<DomeinCreate>({ naam: '', omschrijving: '', basisperiode: 'kwartaal', interventiedrempel: 60 });
  const [saving, setSaving] = useState(false);

  const load = () => getDomeinen().then(setDomeinen);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setAdding(true); setEditing(null); setForm({ naam: '', omschrijving: '', basisperiode: 'kwartaal', interventiedrempel: 60 }); };
  const openEdit = (d: Domein) => { setEditing(d); setAdding(false); setForm({ naam: d.naam, omschrijving: d.omschrijving, basisperiode: d.basisperiode, interventiedrempel: Number(d.interventiedrempel) }); };
  const cancel = () => { setAdding(false); setEditing(null); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await updateDomein(editing.id, form);
      else await createDomein(form);
      await load();
      cancel();
    } finally { setSaving(false); }
  };

  return (
    <div className="bp-tab-content">
      <div className="bp-tab-header">
        <span className="bp-tab-title">Domeinen ({domeinen.length})</span>
        <button className="bp-btn-primary" onClick={openAdd}>+ Nieuw domein</button>
      </div>

      {(adding || editing) && (
        <div className="bp-form-card">
          <h3 className="bp-form-title">{editing ? 'Domein bewerken' : 'Nieuw domein'}</h3>
          <div className="bp-form-grid">
            <label>Naam
              <input className="bp-input" value={form.naam} onChange={e => setForm(f => ({ ...f, naam: e.target.value }))} />
            </label>
            <label>Omschrijving
              <input className="bp-input" value={form.omschrijving} onChange={e => setForm(f => ({ ...f, omschrijving: e.target.value }))} />
            </label>
            <label>Basisperiode
              <select className="bp-input" value={form.basisperiode} onChange={e => setForm(f => ({ ...f, basisperiode: e.target.value }))}>
                <option value="maand">Maand</option>
                <option value="kwartaal">Kwartaal</option>
                <option value="jaar">Jaar</option>
              </select>
            </label>
            <label>Interventiedrempel (0–100)
              <input className="bp-input" type="number" min={0} max={100} value={form.interventiedrempel} onChange={e => setForm(f => ({ ...f, interventiedrempel: Number(e.target.value) }))} />
            </label>
          </div>
          <div className="bp-form-actions">
            <button className="bp-btn-ghost" onClick={cancel}>Annuleren</button>
            <button className="bp-btn-primary" onClick={save} disabled={saving || !form.naam}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </div>
      )}

      <table className="bp-table">
        <thead><tr><th>Naam</th><th>Basisperiode</th><th>Drempel</th><th></th></tr></thead>
        <tbody>
          {domeinen.map(d => (
            <tr key={d.id}>
              <td><strong>{d.naam}</strong><br /><span className="bp-muted">{d.omschrijving}</span></td>
              <td>{d.basisperiode}</td>
              <td>{Number(d.interventiedrempel)}</td>
              <td><button className="bp-btn-ghost bp-btn-sm" onClick={() => openEdit(d)}>Bewerken</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ZaaksoortTab() {
  const [domeinen, setDomeinen] = useState<Domein[]>([]);
  const [domeinId, setDomeinId] = useState<number | null>(null);
  const [zaaksoorten, setZaaksoorten] = useState<Zaaksoort[]>([]);
  const [editing, setEditing] = useState<Zaaksoort | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ZaaksoortCreate>({ naam: '', omschrijving: '', icoon: '', behandeling: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { getDomeinen().then(d => { setDomeinen(d); if (d.length > 0) setDomeinId(d[0].id); }); }, []);
  useEffect(() => { if (domeinId) getZaaksoorten(domeinId).then(setZaaksoorten); }, [domeinId]);

  const openAdd = () => { setAdding(true); setEditing(null); setForm({ naam: '', omschrijving: '', icoon: '', behandeling: '' }); };
  const openEdit = (z: Zaaksoort) => { setEditing(z); setAdding(false); setForm({ naam: z.naam, omschrijving: z.omschrijving, icoon: z.icoon ?? '', behandeling: z.behandeling ?? '' }); };
  const cancel = () => { setAdding(false); setEditing(null); };

  const save = async () => {
    if (!domeinId) return;
    setSaving(true);
    try {
      if (editing) await updateZaaksoort(domeinId, editing.id, form);
      else await createZaaksoort(domeinId, form);
      setZaaksoorten(await getZaaksoorten(domeinId));
      cancel();
    } finally { setSaving(false); }
  };

  return (
    <div className="bp-tab-content">
      <div className="bp-tab-header">
        <span className="bp-tab-title">Zaaksoorten</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="bp-input bp-input-sm" value={domeinId ?? ''} onChange={e => setDomeinId(Number(e.target.value))}>
            {domeinen.map(d => <option key={d.id} value={d.id}>{d.naam}</option>)}
          </select>
          <button className="bp-btn-primary" onClick={openAdd}>+ Nieuw</button>
        </div>
      </div>

      {(adding || editing) && (
        <div className="bp-form-card">
          <h3 className="bp-form-title">{editing ? 'Zaaksoort bewerken' : 'Nieuwe zaaksoort'}</h3>
          <div className="bp-form-grid">
            <label>Naam
              <input className="bp-input" value={form.naam} onChange={e => setForm(f => ({ ...f, naam: e.target.value }))} />
            </label>
            <label>Omschrijving
              <input className="bp-input" value={form.omschrijving} onChange={e => setForm(f => ({ ...f, omschrijving: e.target.value }))} />
            </label>
            <label>Icoon (emoji)
              <input className="bp-input" value={form.icoon ?? ''} onChange={e => setForm(f => ({ ...f, icoon: e.target.value }))} placeholder="bv. 🪪" />
            </label>
            <label>Behandeling
              <select className="bp-input" value={form.behandeling ?? ''} onChange={e => setForm(f => ({ ...f, behandeling: e.target.value }))}>
                <option value="">—</option>
                <option value="Balie">Balie</option>
                <option value="Online">Online</option>
                <option value="Post">Post</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </label>
          </div>
          <div className="bp-form-actions">
            <button className="bp-btn-ghost" onClick={cancel}>Annuleren</button>
            <button className="bp-btn-primary" onClick={save} disabled={saving || !form.naam}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </div>
      )}

      <table className="bp-table">
        <thead><tr><th>#</th><th>Naam</th><th>Behandeling</th><th></th></tr></thead>
        <tbody>
          {zaaksoorten.map(z => (
            <tr key={z.id}>
              <td className="bp-muted">{z.volgorde}</td>
              <td>{z.icoon && <span style={{ marginRight: 6 }}>{z.icoon}</span>}<strong>{z.naam}</strong><br /><span className="bp-muted">{z.omschrijving}</span></td>
              <td>{z.behandeling && <span className="bp-tag">{z.behandeling}</span>}</td>
              <td><button className="bp-btn-ghost bp-btn-sm" onClick={() => openEdit(z)}>Bewerken</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IndicatorenTab() {
  const [indicatoren, setIndicatoren] = useState<Indicator[]>([]);
  const [editing, setEditing] = useState<Indicator | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<IndicatorCreate>({ naam: '', type: 'prestatie', eenheid: '', aggregatiewijze: 'gemiddelde' });
  const [saving, setSaving] = useState(false);

  const load = () => getAlleIndicatoren().then(setIndicatoren);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setAdding(true); setEditing(null); setForm({ naam: '', type: 'prestatie', eenheid: '', aggregatiewijze: 'gemiddelde' }); };
  const openEdit = (i: Indicator) => { setEditing(i); setAdding(false); setForm({ naam: i.naam, type: i.type, eenheid: i.eenheid, aggregatiewijze: i.aggregatiewijze }); };
  const cancel = () => { setAdding(false); setEditing(null); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await updateIndicator(editing.id, form);
      else await createIndicator(form);
      await load();
      cancel();
    } finally { setSaving(false); }
  };

  return (
    <div className="bp-tab-content">
      <div className="bp-tab-header">
        <span className="bp-tab-title">Indicatoren bibliotheek ({indicatoren.length})</span>
        <button className="bp-btn-primary" onClick={openAdd}>+ Nieuw</button>
      </div>

      {(adding || editing) && (
        <div className="bp-form-card">
          <h3 className="bp-form-title">{editing ? 'Indicator bewerken' : 'Nieuwe indicator'}</h3>
          <div className="bp-form-grid">
            <label>Naam
              <input className="bp-input" value={form.naam} onChange={e => setForm(f => ({ ...f, naam: e.target.value }))} />
            </label>
            <label>Type
              <select className="bp-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="prestatie">Prestatie</option>
                <option value="inrichting">Inrichting</option>
              </select>
            </label>
            <label>Eenheid
              <input className="bp-input" value={form.eenheid} onChange={e => setForm(f => ({ ...f, eenheid: e.target.value }))} placeholder="bv. %, dagen, stuks" />
            </label>
            <label>Aggregatiewijze
              <select className="bp-input" value={form.aggregatiewijze} onChange={e => setForm(f => ({ ...f, aggregatiewijze: e.target.value }))}>
                <option value="gemiddelde">Gemiddelde</option>
                <option value="som">Som</option>
                <option value="laatste_waarde">Laatste waarde</option>
                <option value="gewogen_gemiddelde">Gewogen gemiddelde</option>
              </select>
            </label>
          </div>
          <div className="bp-form-actions">
            <button className="bp-btn-ghost" onClick={cancel}>Annuleren</button>
            <button className="bp-btn-primary" onClick={save} disabled={saving || !form.naam}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </div>
      )}

      <table className="bp-table">
        <thead><tr><th>Naam</th><th>Type</th><th>Eenheid</th><th>Aggregatie</th><th></th></tr></thead>
        <tbody>
          {indicatoren.map(i => (
            <tr key={i.id}>
              <td><strong>{i.naam}</strong></td>
              <td><span className={`bp-tag bp-tag-${i.type}`}>{i.type}</span></td>
              <td className="bp-muted">{i.eenheid}</td>
              <td className="bp-muted">{i.aggregatiewijze}</td>
              <td><button className="bp-btn-ghost bp-btn-sm" onClick={() => openEdit(i)}>Bewerken</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KoppelenTab() {
  const [domeinen, setDomeinen] = useState<Domein[]>([]);
  const [domeinId, setDomeinId] = useState<number | null>(null);
  const [alle, setAlle] = useState<Indicator[]>([]);
  const [gekoppeld, setGekoppeld] = useState<DomeinIndicator[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDomeinen().then(d => { setDomeinen(d); if (d.length > 0) setDomeinId(d[0].id); });
    getAlleIndicatoren().then(setAlle);
  }, []);
  useEffect(() => { if (domeinId) getIndicatoren(domeinId).then(setGekoppeld); }, [domeinId]);

  const isGekoppeld = (indicatorId: number) => gekoppeld.some(g => g.indicatorId === indicatorId);
  const getDomeinIndicatorId = (indicatorId: number) => gekoppeld.find(g => g.indicatorId === indicatorId)?.id;

  const toggle = async (indicatorId: number) => {
    if (!domeinId) return;
    setSaving(true);
    try {
      if (isGekoppeld(indicatorId)) {
        const diId = getDomeinIndicatorId(indicatorId);
        if (diId) await ontkoppelIndicator(domeinId, diId);
      } else {
        await koppelIndicator(domeinId, indicatorId);
      }
      setGekoppeld(await getIndicatoren(domeinId));
    } finally { setSaving(false); }
  };

  const prestatie = alle.filter(i => i.type === 'prestatie');
  const inrichting = alle.filter(i => i.type === 'inrichting');

  return (
    <div className="bp-tab-content">
      <div className="bp-tab-header">
        <span className="bp-tab-title">Indicatoren koppelen</span>
        <select className="bp-input bp-input-sm" value={domeinId ?? ''} onChange={e => setDomeinId(Number(e.target.value))}>
          {domeinen.map(d => <option key={d.id} value={d.id}>{d.naam}</option>)}
        </select>
      </div>

      <div className="bp-koppel-groepen">
        {[{ label: 'Prestatie', items: prestatie }, { label: 'Inrichting', items: inrichting }].map(groep => (
          <div key={groep.label} className="bp-koppel-groep">
            <p className="bp-koppel-groep-titel">{groep.label}</p>
            {groep.items.map(i => (
              <label key={i.id} className="bp-koppel-rij">
                <input
                  type="checkbox"
                  checked={isGekoppeld(i.id)}
                  disabled={saving}
                  onChange={() => toggle(i.id)}
                />
                <span>{i.naam}</span>
                <span className="bp-muted bp-koppel-eenheid">{i.eenheid}</span>
              </label>
            ))}
            {groep.items.length === 0 && <p className="bp-muted">Geen indicatoren in bibliotheek.</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PeriodesTab() {
  const [periodes, setPeriodes] = useState<HuidigePeriode[]>([]);
  const [editing, setEditing] = useState<HuidigePeriode | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<PeriodeCreate>({ startdatum: '', einddatum: '', type: 'kwartaal' });
  const [saving, setSaving] = useState(false);

  const load = () => getAllePeriodes().then(setPeriodes);
  useEffect(() => { load(); }, []);

  const toInputDate = (iso: string) => iso.split('T')[0];
  const openAdd = () => { setAdding(true); setEditing(null); setForm({ startdatum: '', einddatum: '', type: 'kwartaal' }); };
  const openEdit = (p: HuidigePeriode) => { setEditing(p); setAdding(false); setForm({ startdatum: toInputDate(p.startdatum), einddatum: toInputDate(p.einddatum), type: p.type }); };
  const cancel = () => { setAdding(false); setEditing(null); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await updatePeriode(editing.id, form);
      else await createPeriode(form);
      await load();
      cancel();
    } finally { setSaving(false); }
  };

  return (
    <div className="bp-tab-content">
      <div className="bp-tab-header">
        <span className="bp-tab-title">Periodes ({periodes.length})</span>
        <button className="bp-btn-primary" onClick={openAdd}>+ Nieuw</button>
      </div>

      {(adding || editing) && (
        <div className="bp-form-card">
          <h3 className="bp-form-title">{editing ? 'Periode bewerken' : 'Nieuwe periode'}</h3>
          <div className="bp-form-grid">
            <label>Type
              <select className="bp-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="maand">Maand</option>
                <option value="kwartaal">Kwartaal</option>
                <option value="jaar">Jaar</option>
              </select>
            </label>
            <label>Startdatum
              <input className="bp-input" type="date" value={form.startdatum} onChange={e => setForm(f => ({ ...f, startdatum: e.target.value }))} />
            </label>
            <label>Einddatum
              <input className="bp-input" type="date" value={form.einddatum} onChange={e => setForm(f => ({ ...f, einddatum: e.target.value }))} />
            </label>
          </div>
          <div className="bp-form-actions">
            <button className="bp-btn-ghost" onClick={cancel}>Annuleren</button>
            <button className="bp-btn-primary" onClick={save} disabled={saving || !form.startdatum || !form.einddatum}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </div>
      )}

      <table className="bp-table">
        <thead><tr><th>Label</th><th>Type</th><th>Start</th><th>Eind</th><th></th></tr></thead>
        <tbody>
          {periodes.map(p => (
            <tr key={p.id}>
              <td><strong>{periodeLabel(p)}</strong></td>
              <td className="bp-muted">{p.type}</td>
              <td className="bp-muted">{formatDatum(p.startdatum)}</td>
              <td className="bp-muted">{formatDatum(p.einddatum)}</td>
              <td><button className="bp-btn-ghost bp-btn-sm" onClick={() => openEdit(p)}>Bewerken</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ROLLEN = ['beheerder', 'redacteur', 'lezer'];

function GebruikersTab() {
  const { user, refreshRollen } = useAuth();
  const [gebruikers, setGebruikers] = useState<GebruikerDetail[]>([]);
  const [domeinen, setDomeinen] = useState<Domein[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ naam: '', email: '', wachtwoord: '' });
  const [rolForm, setRolForm] = useState({ domeinId: 0, rol: 'lezer' });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [fout, setFout] = useState('');

  const load = () => getGebruikers().then(setGebruikers);
  useEffect(() => { load(); getDomeinen().then(d => { setDomeinen(d); if (d.length > 0) setRolForm(f => ({ ...f, domeinId: d[0].id })); }); }, []);

  const saveGebruiker = async () => {
    setSaving(true); setFout('');
    try {
      await createGebruiker(form);
      await load();
      setAdding(false);
      setForm({ naam: '', email: '', wachtwoord: '' });
    } catch { setFout('Aanmaken mislukt — e-mailadres mogelijk al in gebruik.'); }
    finally { setSaving(false); }
  };

  const saveRol = async (gebruikerId: number) => {
    setSaving(true);
    try {
      await koppelRol(gebruikerId, rolForm.domeinId, rolForm.rol);
      await load();
      // Als de gekoppelde gebruiker de ingelogde gebruiker is, ververs de sessie
      if (gebruikerId === user?.id) await refreshRollen();
    } finally { setSaving(false); }
  };

  const verwijderRol = async (gebruikerId: number, rolId: number) => {
    await ontkoppelRol(gebruikerId, rolId);
    await load();
    if (gebruikerId === user?.id) await refreshRollen();
  };

  const resetWachtwoord = async (gebruikerId: number) => {
    const nieuw = prompt('Nieuw wachtwoord:');
    if (!nieuw) return;
    await wijzigWachtwoord(gebruikerId, nieuw);
  };

  return (
    <div className="bp-tab-content">
      <div className="bp-tab-header">
        <span className="bp-tab-title">Gebruikers ({gebruikers.length})</span>
        <button className="bp-btn-primary" onClick={() => setAdding(a => !a)}>+ Nieuw</button>
      </div>

      {adding && (
        <div className="bp-form-card">
          <h3 className="bp-form-title">Nieuwe gebruiker</h3>
          <div className="bp-form-grid">
            <label>Naam<input className="bp-input" value={form.naam} onChange={e => setForm(f => ({ ...f, naam: e.target.value }))} /></label>
            <label>E-mailadres<input className="bp-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></label>
            <label>Wachtwoord<input className="bp-input" type="password" value={form.wachtwoord} onChange={e => setForm(f => ({ ...f, wachtwoord: e.target.value }))} /></label>
          </div>
          {fout && <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', margin: 0 }}>{fout}</p>}
          <div className="bp-form-actions">
            <button className="bp-btn-ghost" onClick={() => { setAdding(false); setFout(''); }}>Annuleren</button>
            <button className="bp-btn-primary" onClick={saveGebruiker} disabled={saving || !form.naam || !form.email || !form.wachtwoord}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </div>
      )}

      <table className="bp-table">
        <thead><tr><th>Naam</th><th>E-mail</th><th>Rollen</th><th></th></tr></thead>
        <tbody>
          {gebruikers.map(g => (
            <>
              <tr key={g.id}>
                <td><strong>{g.naam}</strong></td>
                <td className="bp-muted">{g.email}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {g.rollen.map(r => (
                      <span key={r.id} className={`bp-tag bp-tag-rol-${r.rol}`} title={r.domeinNaam}>
                        {r.domeinNaam}: {r.rol}
                        <button className="bp-tag-del" onClick={() => verwijderRol(g.id, r.id)}>×</button>
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="bp-btn-ghost bp-btn-sm" onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}>+ Rol</button>
                    <button className="bp-btn-ghost bp-btn-sm" onClick={() => resetWachtwoord(g.id)}>Wachtwoord</button>
                  </div>
                </td>
              </tr>
              {expandedId === g.id && (
                <tr key={`${g.id}-rol`}>
                  <td colSpan={4}>
                    <div className="bp-rol-form">
                      <select className="bp-input bp-input-sm" value={rolForm.domeinId} onChange={e => setRolForm(f => ({ ...f, domeinId: Number(e.target.value) }))}>
                        {domeinen.map(d => <option key={d.id} value={d.id}>{d.naam}</option>)}
                      </select>
                      <select className="bp-input bp-input-sm" value={rolForm.rol} onChange={e => setRolForm(f => ({ ...f, rol: e.target.value }))}>
                        {ROLLEN.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button className="bp-btn-primary bp-btn-sm" onClick={() => saveRol(g.id)} disabled={saving}>Koppelen</button>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BeheerPage() {
  const [tab, setTab] = useState<Tab>('domeinen');

  return (
    <div className="bp-root">
      <div className="bp-page-header">
        <h1 className="bp-page-titel">Beheer</h1>
      </div>
      <div className="bp-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`bp-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="bp-tab-body">
        {tab === 'domeinen'    && <DomeinenTab />}
        {tab === 'zaaksoorten' && <ZaaksoortTab />}
        {tab === 'indicatoren' && <IndicatorenTab />}
        {tab === 'koppelen'    && <KoppelenTab />}
        {tab === 'periodes'    && <PeriodesTab />}
        {tab === 'gebruikers'  && <GebruikersTab />}
      </div>
    </div>
  );
}
