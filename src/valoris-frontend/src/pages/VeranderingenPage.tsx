import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getVeranderingen, createVerandering, updateVerandering, importVeranderingenCsv,
  getZaaksoorten, getIndicatoren, getMetingsdoelen, getVeranderimpact,
  createVeranderimpact, updateVeranderimpact, deleteVeranderimpact,
  getHuidigePeride, getMetingen,
  type Verandering, type VeranderingCreate, type Zaaksoort,
  type DomeinIndicator, type Metingsdoel, type Veranderimpact, type Meting,
} from '../api/client';
import { Modal } from '../components/Modal';
import './VeranderingenPage.css';

const TYPEN = ['structureel', 'procesmatig', 'technisch', 'overig'];
const STATUSSEN = ['gepland', 'actief', 'afgerond', 'geannuleerd'];
const STATUS_LABELS: Record<string, string> = { gepland: 'Concept', actief: 'Actief', afgerond: 'Afgerond', geannuleerd: 'Geannuleerd' };
const STATUS_COLORS: Record<string, string> = { gepland: '#6b7280', actief: '#0e9f6e', afgerond: '#1a56db', geannuleerd: '#e02424' };
const TYPE_ICONS: Record<string, string> = { structureel: '◉', procesmatig: '◎', technisch: '⚙', overig: '○' };

function relatieveDatum(datumStr: string): string {
  const dagen = Math.floor((Date.now() - new Date(datumStr).getTime()) / 86400000);
  if (dagen === 0) return 'vandaag';
  if (dagen === 1) return 'gisteren';
  if (dagen < 7) return `${dagen} dagen geleden`;
  if (dagen < 14) return '1 week geleden';
  if (dagen < 30) return `${Math.floor(dagen / 7)} weken geleden`;
  return `${Math.floor(dagen / 30)} maanden geleden`;
}

function today() { return new Date().toISOString().slice(0, 10); }

const leegForm: VeranderingCreate = {
  domeinId: 0, naam: '', omschrijving: '', type: 'overig', status: 'gepland',
  prioriteit: 0, kosten: 0, startdatum: today(), einddatum: today(),
};

export function VeranderingenPage() {
  const { domeinId } = useParams<{ domeinId: string }>();
  const id = parseInt(domeinId!);

  const [veranderingen, setVeranderingen] = useState<Verandering[]>([]);
  const [zaaksoorten, setZaaksoorten] = useState<Zaaksoort[]>([]);
  const [indicatoren, setIndicatoren] = useState<DomeinIndicator[]>([]);
  const [metingsdoelen, setMetingsdoelen] = useState<Metingsdoel[]>([]);
  const [impacts, setImpacts] = useState<Veranderimpact[]>([]);
  const [metingen, setMetingen] = useState<Meting[]>([]);
  const [huidigePeriodeId, setHuidigePeriodeId] = useState<number | null>(null);

  const [selectedVeranderingId, setSelectedVeranderingId] = useState<number | null>(null);
  const [selectedZaaksoortId, setSelectedZaaksoortId] = useState<number | null>(null);

  const [modal, setModal] = useState<'nieuw' | 'bewerk' | 'csv' | null>(null);
  const [bewerkVerandering, setBewerkVerandering] = useState<Verandering | null>(null);
  const [form, setForm] = useState<VeranderingCreate>({ ...leegForm, domeinId: id });
  const [csvStatus, setCsvStatus] = useState('');
  const [editingImpact, setEditingImpact] = useState<{ doelId: number; waarde: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const laad = async () => {
    const [v, z, i, m, imp, mt, p] = await Promise.all([
      getVeranderingen(id),
      getZaaksoorten(id),
      getIndicatoren(id),
      getMetingsdoelen(id),
      getVeranderimpact(id),
      getMetingen(id),
      getHuidigePeride(id),
    ]);
    setVeranderingen(v);
    setZaaksoorten(z);
    setIndicatoren(i);
    setMetingsdoelen(m);
    setImpacts(imp);
    setMetingen(mt);
    setHuidigePeriodeId(p.id);
  };

  useEffect(() => { laad(); }, [id]);

  const selectedVerandering = veranderingen.find(v => v.id === selectedVeranderingId) ?? null;

  // Impact lookups
  const impactenVoorVerandering = impacts.filter(i => i.veranderingId === selectedVeranderingId);

  const zaaksoortImpactCount = (zaaksoortId: number): number => {
    const doelIds = metingsdoelen.filter(m => m.zaaksoortId === zaaksoortId).map(m => m.id);
    return impactenVoorVerandering.filter(i => doelIds.includes(i.metingsdoelId)).length;
  };

  const gekoppeldeZaaksoorten = zaaksoorten.filter(z => zaaksoortImpactCount(z.id) > 0);

  const impactVoorDoel = (doelId: number): Veranderimpact | undefined =>
    impactenVoorVerandering.find(i => i.metingsdoelId === doelId);

  const doelVoorZaaksoortEnIndicator = (zaaksoortId: number, domeinIndicatorId: number): Metingsdoel | undefined =>
    metingsdoelen.find(m => m.zaaksoortId === zaaksoortId && m.domeinIndicatorId === domeinIndicatorId);

  // Zaaksoorten gekoppeld aan geselecteerde verandering (met impacts)
  const veranderingZaaksoortTags = (v: Verandering): Zaaksoort[] => {
    const doelIds = metingsdoelen.map(m => m.id);
    const gekoppeld = impacts
      .filter(i => i.veranderingId === v.id && doelIds.includes(i.metingsdoelId))
      .map(i => metingsdoelen.find(m => m.id === i.metingsdoelId)?.zaaksoortId)
      .filter((x): x is number => x !== undefined);
    const uniek = [...new Set(gekoppeld)];
    return zaaksoorten.filter(z => uniek.includes(z.id));
  };

  // Impact opslaan
  const slaImpactOp = async (doelId: number, waardeStr: string) => {
    const waarde = parseFloat(waardeStr);
    if (isNaN(waarde)) { setEditingImpact(null); return; }
    const bestaand = impactVoorDoel(doelId);
    if (bestaand) {
      await updateVeranderimpact(bestaand.id, { waarde, type: bestaand.type });
    } else if (selectedVeranderingId && huidigePeriodeId) {
      await createVeranderimpact({ veranderingId: selectedVeranderingId, metingsdoelId: doelId, periodeId: huidigePeriodeId, waarde, type: 'verwacht' });
    }
    setEditingImpact(null);
    await laad();
  };

  const verwijderImpact = async (doelId: number) => {
    const bestaand = impactVoorDoel(doelId);
    if (bestaand) { await deleteVeranderimpact(bestaand.id); await laad(); }
  };

  const verwijderAlleImpacts = async (zaaksoortId: number) => {
    const doelIds = metingsdoelen.filter(m => m.zaaksoortId === zaaksoortId).map(m => m.id);
    const te = impactenVoorVerandering.filter(i => doelIds.includes(i.metingsdoelId));
    await Promise.all(te.map(i => deleteVeranderimpact(i.id)));
    await laad();
  };

  // Verandering opslaan
  const slaVeranderingOp = async () => {
    if (modal === 'nieuw') {
      await createVerandering(form);
    } else if (modal === 'bewerk' && bewerkVerandering) {
      await updateVerandering(bewerkVerandering.id, { naam: form.naam, omschrijving: form.omschrijving, type: form.type, status: form.status, prioriteit: form.prioriteit, kosten: form.kosten, startdatum: form.startdatum, einddatum: form.einddatum });
    }
    await laad();
    setModal(null);
  };

  const openBewerk = (v: Verandering) => {
    setBewerkVerandering(v);
    setForm({ domeinId: v.domeinId, naam: v.naam, omschrijving: v.omschrijving, type: v.type, status: v.status, prioriteit: v.prioriteit, kosten: v.kosten, startdatum: v.startdatum.slice(0, 10), einddatum: v.einddatum.slice(0, 10) });
    setModal('bewerk');
  };

  const importCsv = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setCsvStatus('Bezig…');
    try {
      const res = await importVeranderingenCsv(id, file);
      setCsvStatus(`${res.imported} rijen geïmporteerd.`);
      await laad();
    } catch { setCsvStatus('Import mislukt.'); }
  };

  const setF = (k: keyof VeranderingCreate, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  // Alleen indicatoren met een metingsdoel voor de geselecteerde zaaksoort
  const doelsVoorZaaksoort = selectedZaaksoortId
    ? metingsdoelen.filter(m => m.zaaksoortId === selectedZaaksoortId)
    : [];
  const relevanteIndicatorIds = new Set(doelsVoorZaaksoort.map(m => m.domeinIndicatorId));

  const prestatieIndicatoren = indicatoren.filter(i => i.type === 'prestatie' && relevanteIndicatorIds.has(i.id));
  const inrichtingIndicatoren = indicatoren.filter(i => i.type === 'inrichting' && relevanteIndicatorIds.has(i.id));

  // IST-waarde (huidige periode)
  const istWaarde = (doelId: number): number | null => {
    if (!huidigePeriodeId) return null;
    const m = metingen.find(mt => mt.metingsdoelId === doelId && mt.periodeId === huidigePeriodeId);
    return m?.waarde ?? null;
  };

  return (
    <div className="vp-root">
      {/* LEFT — veranderingen lijst */}
      <aside className="vp-left">
        <div className="vp-left-header">
          <span className="vp-section-label">VERANDERINGEN</span>
          <div className="vp-left-actions">
            <button className="tab-btn" onClick={() => { setForm({ ...leegForm, domeinId: id }); setBewerkVerandering(null); setModal('nieuw'); }}>+ Nieuw</button>
            <button className="tab-btn" onClick={() => setModal('csv')}>Import</button>
          </div>
        </div>
        <div className="vp-verlist">
          {veranderingen.length === 0 && <p className="vp-leeg">Geen veranderingen.</p>}
          {veranderingen.map(v => {
            const tags = veranderingZaaksoortTags(v);
            return (
              <div
                key={v.id}
                className={`vp-ver-item ${selectedVeranderingId === v.id ? 'selected' : ''}`}
                onClick={() => { setSelectedVeranderingId(v.id); setSelectedZaaksoortId(null); }}
              >
                <div className="vp-ver-top">
                  <span className="vp-ver-icon">{TYPE_ICONS[v.type] ?? '○'}</span>
                  <span className="vp-ver-naam">{v.naam}</span>
                  <StatusBadge status={v.status} />
                  <button className="tab-btn" style={{ flexShrink: 0 }} onClick={e => { e.stopPropagation(); openBewerk(v); }}>✎</button>
                </div>
                <div className="vp-ver-meta">{v.type} · {relatieveDatum(v.startdatum)}</div>
                {tags.length > 0 && (
                  <div className="vp-ver-tags">
                    {tags.map(z => <span key={z.id} className="zaak-tag">{z.naam}</span>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* RIGHT — klantreis + impact */}
      <main className="vp-main">
        {!selectedVerandering ? (
          <div className="vp-placeholder">
            <p>Selecteer een verandering om de impact te bekijken.</p>
          </div>
        ) : (
          <>
            {/* Klantreis strip */}
            <div className="vp-klantreis-header">
              <span className="vp-section-label">ZAAKSOORTEN — KLIK OM IMPACT TE REGISTREREN</span>
              <span className="vp-section-meta">{gekoppeldeZaaksoorten.length} zaaksoort{gekoppeldeZaaksoorten.length !== 1 ? 'en' : ''} gekoppeld</span>
            </div>
            <div className="vp-klantreis-strip">
              {zaaksoorten.map((z, i) => {
                const count = zaaksoortImpactCount(z.id);
                const selected = selectedZaaksoortId === z.id;
                return (
                  <div key={z.id} className="vp-zaak-wrap">
                    <div
                      className={`vp-zaak-chip ${selected ? 'selected' : ''} ${count > 0 ? 'heeft-impact' : ''}`}
                      onClick={() => setSelectedZaaksoortId(z.id === selectedZaaksoortId ? null : z.id)}
                    >
                      {count > 0 && <span className="vp-zaak-check">✓</span>}
                      <span className="vp-zaak-naam">{z.naam}</span>
                      {count > 0 && <span className="vp-zaak-count">{count} impact{count !== 1 ? 's' : ''}</span>}
                    </div>
                    {i < zaaksoorten.length - 1 && <span className="vp-zaak-arrow">›</span>}
                  </div>
                );
              })}
            </div>

            {/* Impact detail */}
            {selectedZaaksoortId && (
              <div className="vp-impact-area">
                <div className="vp-impact-header">
                  <span className="vp-impact-title">
                    <strong>{selectedVerandering.naam.toUpperCase()}</strong>
                    {' → '}
                    {zaaksoorten.find(z => z.id === selectedZaaksoortId)?.naam}
                  </span>
                  {zaaksoortImpactCount(selectedZaaksoortId) > 0 && (
                    <button className="btn-danger-sm" onClick={() => verwijderAlleImpacts(selectedZaaksoortId)}>Alles verwijderen</button>
                  )}
                </div>

                <div className="vp-impact-columns">
                  {/* Vastgelegde impacts */}
                  <div className="vp-impact-vastgelegd">
                    <p className="vp-section-label">Vastgelegde impact voor {zaaksoorten.find(z => z.id === selectedZaaksoortId)?.naam}</p>
                    {(() => {
                      const doelIds = metingsdoelen.filter(m => m.zaaksoortId === selectedZaaksoortId);
                      const actief = doelIds.filter(m => impactVoorDoel(m.id));
                      if (actief.length === 0) return <p className="vp-leeg">Nog geen impacts.</p>;
                      return actief.map(m => {
                        const imp = impactVoorDoel(m.id)!;
                        const ind = indicatoren.find(i => i.id === m.domeinIndicatorId);
                        return (
                          <div key={m.id} className="vp-vastgelegd-item">
                            <span className="vp-vastgelegd-naam">{ind?.indicatorNaam ?? m.indicatorNaam}</span>
                            <ImpactBadge waarde={imp.waarde} eenheid={ind?.eenheid ?? ''} />
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Indicatoren panelen */}
                  <div className="vp-indicatoren-panel">
                    {prestatieIndicatoren.length > 0 && (
                      <IndicatorGroep
                        label="PRESTATIE-INDICATOREN"
                        indicatoren={prestatieIndicatoren}
                        zaaksoortId={selectedZaaksoortId}
                        impactVoorDoel={impactVoorDoel}
                        doelVoorZaaksoortEnIndicator={doelVoorZaaksoortEnIndicator}
                        istWaarde={istWaarde}
                        editingImpact={editingImpact}
                        setEditingImpact={setEditingImpact}
                        slaImpactOp={slaImpactOp}
                        verwijderImpact={verwijderImpact}
                      />
                    )}
                    {inrichtingIndicatoren.length > 0 && (
                      <IndicatorGroep
                        label="INRICHTINGSINDICATOREN"
                        indicatoren={inrichtingIndicatoren}
                        zaaksoortId={selectedZaaksoortId}
                        impactVoorDoel={impactVoorDoel}
                        doelVoorZaaksoortEnIndicator={doelVoorZaaksoortEnIndicator}
                        istWaarde={istWaarde}
                        editingImpact={editingImpact}
                        setEditingImpact={setEditingImpact}
                        slaImpactOp={slaImpactOp}
                        verwijderImpact={verwijderImpact}
                      />
                    )}
                  </div>
                </div>

                <div className="vp-ver-info">
                  Type: {selectedVerandering.type} · Status: {selectedVerandering.status}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {(modal === 'nieuw' || modal === 'bewerk') && (
        <Modal
          title={modal === 'nieuw' ? 'Nieuwe verandering' : 'Verandering bewerken'}
          onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Annuleren</button><button className="btn-primary" onClick={slaVeranderingOp}>Opslaan</button></>}
        >
          <div className="form-row"><label>Naam *</label><input value={form.naam} onChange={e => setF('naam', e.target.value)} required /></div>
          <div className="form-row"><label>Omschrijving</label><textarea value={form.omschrijving} onChange={e => setF('omschrijving', e.target.value)} rows={2} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-row"><label>Type</label><select value={form.type} onChange={e => setF('type', e.target.value)}>{TYPEN.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="form-row"><label>Status</label><select value={form.status} onChange={e => setF('status', e.target.value)}>{STATUSSEN.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
            <div className="form-row"><label>Startdatum</label><input type="date" value={form.startdatum} onChange={e => setF('startdatum', e.target.value)} /></div>
            <div className="form-row"><label>Einddatum</label><input type="date" value={form.einddatum} onChange={e => setF('einddatum', e.target.value)} /></div>
          </div>
        </Modal>
      )}

      {modal === 'csv' && (
        <Modal title="CSV importeren" onClose={() => { setModal(null); setCsvStatus(''); }}
          footer={<><button className="btn-secondary" onClick={() => { setModal(null); setCsvStatus(''); }}>Sluiten</button><button className="btn-primary" onClick={importCsv}>Importeren</button></>}
        >
          <p style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Verplichte kolom: <strong>Naam</strong>. Optioneel: Omschrijving, Type, Status.</p>
          <input type="file" accept=".csv" ref={fileRef} />
          {csvStatus && <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>{csvStatus}</p>}
        </Modal>
      )}
    </div>
  );
}

// --- Sub-components ---

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: STATUS_COLORS[status] ?? 'var(--color-text-muted)', background: `${STATUS_COLORS[status]}18`, border: `1px solid ${STATUS_COLORS[status]}44`, borderRadius: 'var(--radius-sm)', padding: '1px 7px' }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ImpactBadge({ waarde, eenheid }: { waarde: number; eenheid: string }) {
  const pos = waarde >= 0;
  return (
    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: pos ? 'var(--color-success)' : 'var(--color-danger)', background: pos ? 'var(--color-success-light)' : 'var(--color-danger-light)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontVariantNumeric: 'tabular-nums' }}>
      {pos ? '+' : ''}{waarde} {eenheid}
    </span>
  );
}

interface IndicatorGroepProps {
  label: string;
  indicatoren: DomeinIndicator[];
  zaaksoortId: number;
  impactVoorDoel: (id: number) => Veranderimpact | undefined;
  doelVoorZaaksoortEnIndicator: (zaaksoortId: number, domeinIndicatorId: number) => Metingsdoel | undefined;
  istWaarde: (doelId: number) => number | null;
  editingImpact: { doelId: number; waarde: string } | null;
  setEditingImpact: (v: { doelId: number; waarde: string } | null) => void;
  slaImpactOp: (doelId: number, waarde: string) => Promise<void>;
  verwijderImpact: (doelId: number) => Promise<void>;
}

function IndicatorGroep({ label, indicatoren, zaaksoortId, impactVoorDoel, doelVoorZaaksoortEnIndicator, istWaarde, editingImpact, setEditingImpact, slaImpactOp, verwijderImpact }: IndicatorGroepProps) {
  return (
    <div className="ind-groep">
      <p className="vp-section-label">{label}</p>
      {indicatoren.map(ind => {
        const doel = doelVoorZaaksoortEnIndicator(zaaksoortId, ind.id);
        const imp = doel ? impactVoorDoel(doel.id) : undefined;
        const editing = doel && editingImpact?.doelId === doel.id;
        const ist = doel ? istWaarde(doel.id) : null;

        return (
          <div key={ind.id} className={`ind-rij ${imp ? 'heeft-impact' : ''}`}>
            <div className="ind-dot" style={{ background: imp ? (imp.waarde >= 0 ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--color-border)' }} />
            <span className="ind-naam">
              {ind.indicatorNaam}
              {ist !== null && (
                <span className="ind-ist" title="Huidige meetwaarde">
                  {ist} {ind.eenheid}
                </span>
              )}
            </span>
            <div className="ind-waarde">
              {editing ? (
                <input
                  className="ind-input"
                  autoFocus
                  defaultValue={imp?.waarde ?? ''}
                  placeholder={`verwachte Δ (${ind.eenheid})`}
                  onKeyDown={e => { if (e.key === 'Enter') slaImpactOp(doel!.id, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingImpact(null); }}
                  onBlur={e => slaImpactOp(doel!.id, e.target.value)}
                />
              ) : imp ? (
                <span className="ind-badge" onClick={() => setEditingImpact({ doelId: doel!.id, waarde: String(imp.waarde) })} title="Klik om te bewerken">
                  <ImpactBadge waarde={imp.waarde} eenheid={ind.eenheid} />
                </span>
              ) : doel ? (
                <button className="ind-toevoegen" onClick={() => setEditingImpact({ doelId: doel.id, waarde: '' })}>+ impact</button>
              ) : null}
              {doel && imp && !editing && (
                <button className="ind-delete" onClick={() => verwijderImpact(doel.id)} title="Verwijder impact">×</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
