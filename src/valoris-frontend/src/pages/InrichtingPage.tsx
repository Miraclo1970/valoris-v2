import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getZaaksoorten, getIndicatoren, getAlleIndicatoren, koppelIndicator,
  getMetingsdoelen, getMetingen,
  createMetingsdoel, updateMetingsdoel, createMeting, updateMeting,
  getPeriodes, getDomeinen,
  type Zaaksoort, type DomeinIndicator, type Indicator, type Metingsdoel, type Meting,
  type HuidigePeriode, type MetingsdoelCreate,
} from '../api/client';
import { Modal } from '../components/Modal';
import './InrichtingPage.css';

const NORM_RICHTING = [
  { value: 'hogerisbeter', label: 'Hoger is beter (>)' },
  { value: 'lagerisbeter', label: 'Lager is beter (<)' },
];

function normLabel(md: Metingsdoel): string {
  const sym = md.normRichting === 'lagerisbeter' ? '<' : '>';
  return `${sym} ${md.normWaarde}`;
}

function periodeNaam(p: HuidigePeriode, type: string): string {
  const d = new Date(p.startdatum);
  if (type === 'kwartaal') return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
  if (type === 'maand') return d.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  return `${d.getFullYear()}`;
}

const PERIODE_TYPEN = ['maand', 'kwartaal', 'jaar'] as const;
type PeriodeType = typeof PERIODE_TYPEN[number];

export function InrichtingPage() {
  const { domeinId } = useParams<{ domeinId: string }>();
  const id = parseInt(domeinId!);

  const [zaaksoorten, setZaaksoorten] = useState<Zaaksoort[]>([]);
  const [indicatoren, setIndicatoren] = useState<DomeinIndicator[]>([]);
  const [bibliotheek, setBibliotheek] = useState<Indicator[]>([]);
  const [metingsdoelen, setMetingsdoelen] = useState<Metingsdoel[]>([]);
  const [metingen, setMetingen] = useState<Meting[]>([]);
  const [allePeriodes, setAllePeriodes] = useState<HuidigePeriode[]>([]);

  const [selectedZaaksoortId, setSelectedZaaksoortId] = useState<number | null>(null);
  const [periodeType, setPeriodeType] = useState<PeriodeType>('kwartaal');
  const [periodeIdx, setPeriodeIdx] = useState(0);

  const [metingInput, setMetingInput] = useState<{ doelId: number; waarde: string } | null>(null);
  const [nieuwDoelModal, setNieuwDoelModal] = useState<'prestatie' | 'inrichting' | null>(null);
  const [doelForm, setDoelForm] = useState<MetingsdoelCreate>({ domeinIndicatorId: 0, zaaksoortId: 0, normWaarde: 0, normRichting: 'hogerisbeter', gewicht: 1 });

  const laad = async () => {
    const [domeinen, z, i, bib, m, mt, p] = await Promise.all([
      getDomeinen(),
      getZaaksoorten(id),
      getIndicatoren(id),
      getAlleIndicatoren(),
      getMetingsdoelen(id),
      getMetingen(id),
      getPeriodes(id),
    ]);
    const d = domeinen.find(x => x.id === id) ?? null;
    setZaaksoorten(z);
    setIndicatoren(i);
    setBibliotheek(bib);
    setMetingsdoelen(m);
    setMetingen(mt);
    setAllePeriodes(p);
    if (d) setPeriodeType(d.basisperiode as PeriodeType);
    if (!selectedZaaksoortId && z.length > 0) setSelectedZaaksoortId(z[0].id);
  };

  useEffect(() => { laad(); }, [id]);

  const periodes = allePeriodes.filter(p => p.type === periodeType);
  const huidigePeriode = periodes[periodeIdx] ?? null;
  const vorigePeriode = periodes[periodeIdx + 1] ?? null;

  const selectedZaaksoort = zaaksoorten.find(z => z.id === selectedZaaksoortId);
  const doelen = metingsdoelen.filter(m => m.zaaksoortId === selectedZaaksoortId);
  const prestatieDoelen = doelen.filter(m => {
    const ind = indicatoren.find(i => i.id === m.domeinIndicatorId);
    return ind?.type === 'prestatie';
  });
  const inrichtingDoelen = doelen.filter(m => {
    const ind = indicatoren.find(i => i.id === m.domeinIndicatorId);
    return ind?.type === 'inrichting';
  });

  const metingVoorDoel = (doelId: number, periodeId?: number): Meting | undefined =>
    metingen.find(m => m.metingsdoelId === doelId && m.periodeId === (periodeId ?? huidigePeriode?.id));

  const trend = (doelId: number): number | null => {
    const huidig = metingVoorDoel(doelId);
    const vorig = vorigePeriode ? metingVoorDoel(doelId, vorigePeriode.id) : undefined;
    if (!huidig || !vorig) return null;
    return Math.round((huidig.waarde - vorig.waarde) * 1000) / 1000;
  };

  const aantalActief = (type: 'prestatie' | 'inrichting') =>
    (type === 'prestatie' ? prestatieDoelen : inrichtingDoelen)
      .filter(m => metingVoorDoel(m.id)).length;

  const slaMetingOp = async (doelId: number, waardeStr: string) => {
    const waarde = parseFloat(waardeStr);
    if (isNaN(waarde) || !huidigePeriode) { setMetingInput(null); return; }
    const bestaand = metingVoorDoel(doelId);
    if (bestaand) {
      await updateMeting(bestaand.id, { waarde, datum: bestaand.datum, bron: bestaand.bron, gevalideerd: bestaand.gevalideerd });
    } else {
      await createMeting({ metingsdoelId: doelId, periodeId: huidigePeriode.id, waarde, datum: new Date().toISOString(), bron: 'Handmatig' });
    }
    setMetingInput(null);
    await laad();
  };

  const slaDoelOp = async () => {
    if (!selectedZaaksoortId) return;
    let domeinIndicatorId = doelForm.domeinIndicatorId;
    // Negatieve ID = bibliotheek-indicator die nog niet gekoppeld is → auto-koppelen
    if (domeinIndicatorId < 0) {
      const bibliotheekId = -domeinIndicatorId;
      domeinIndicatorId = await koppelIndicator(id, bibliotheekId);
    }
    await createMetingsdoel({ ...doelForm, domeinIndicatorId, zaaksoortId: selectedZaaksoortId });
    await laad();
    setNieuwDoelModal(null);
  };

  const deactiveerDoel = async (md: Metingsdoel) => {
    await updateMetingsdoel(md.id, { normWaarde: md.normWaarde, normRichting: md.normRichting, gewicht: md.gewicht, actief: false });
    await laad();
  };

  // Geeft DomeinIndicatoren terug voor dit domein, aangevuld vanuit de bibliotheek als er nog geen gekoppeld zijn
  const beschikbareIndicatoren = (type: 'prestatie' | 'inrichting') => {
    const gekoppeld = indicatoren.filter(i => i.type === type && !doelen.some(d => d.domeinIndicatorId === i.id));
    if (gekoppeld.length > 0) return gekoppeld;
    // Bibliotheek-indicatoren die nog niet aan dit domein gekoppeld zijn
    return bibliotheek
      .filter(b => b.type === type)
      .filter(b => !indicatoren.some(i => i.indicatorId === b.id))
      .map(b => ({
        id: -b.id, // negatief = nog niet gekoppeld, wordt auto-gekoppeld bij opslaan
        domeinId: id, indicatorId: b.id, indicatorNaam: b.naam,
        type: b.type, eenheid: b.eenheid, aggregatiewijze: b.aggregatiewijze, actief: true,
      } as DomeinIndicator));
  };

  const openNieuwDoel = (type: 'prestatie' | 'inrichting') => {
    setDoelForm({ domeinIndicatorId: beschikbareIndicatoren(type)[0]?.id ?? 0, zaaksoortId: selectedZaaksoortId ?? 0, normWaarde: 0, normRichting: 'hogerisbeter', gewicht: 1 });
    setNieuwDoelModal(type);
  };

  return (
    <div className="ip-root">
      {/* Klantreis strip */}
      <div className="ip-klantreis-wrap">
        <span className="ip-section-label">KLANTREIS (ZAAKSOORTEN)</span>
        <div className="ip-klantreis-strip">
          {zaaksoorten.map((z, i) => (
            <div key={z.id} className="ip-zaak-wrap">
              <div
                className={`ip-zaak-chip ${selectedZaaksoortId === z.id ? 'selected' : ''}`}
                onClick={() => setSelectedZaaksoortId(z.id)}
              >
                {z.icoon && <span className="ip-zaak-icoon">{z.icoon}</span>}
                <span className="ip-zaak-naam">{z.naam}</span>
                {z.behandeling && <span className="ip-zaak-behandeling">{z.behandeling}</span>}
              </div>
              {i < zaaksoorten.length - 1 && <span className="ip-zaak-arrow">›</span>}
            </div>
          ))}
        </div>
      </div>

      {!selectedZaaksoort ? (
        <div className="ip-placeholder">Selecteer een zaaksoort.</div>
      ) : (
        <div className="ip-body">
          {/* Links: zaaksoort detail + periode — één box */}
          <div className="ip-detail-panel">
            <div className="ip-zaak-header">
              <h2 className="ip-zaak-naam-groot">{selectedZaaksoort.naam}</h2>
              <div className="ip-zaak-stats">
                <span>{aantalActief('prestatie')} prestatie indicator{aantalActief('prestatie') !== 1 ? 'en' : ''} actief</span>
                <span>{aantalActief('inrichting')} inrichting indicator{aantalActief('inrichting') !== 1 ? 'en' : ''} actief</span>
              </div>
            </div>
            {selectedZaaksoort.omschrijving && (
              <p className="ip-zaak-omschrijving">{selectedZaaksoort.omschrijving}</p>
            )}
            <div className="ip-zaak-tags">
              {selectedZaaksoort.actief && <span className="ip-tag ip-tag-actief">Actief</span>}
            </div>

            <hr className="ip-divider" />

            <p className="ip-section-label">Periodeweergave</p>
            <div className="ip-periode-toggle">
              {PERIODE_TYPEN.map(t => {
                const beschikbaar = allePeriodes.some(p => p.type === t);
                return (
                  <button
                    key={t}
                    className={`ip-toggle-btn ${periodeType === t ? 'active' : ''}`}
                    onClick={() => { if (beschikbaar) { setPeriodeType(t); setPeriodeIdx(0); } }}
                    disabled={!beschikbaar}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>

            <hr className="ip-divider" />

            <p className="ip-section-label">Periode navigatie</p>
            <div className="ip-periode-controls">
              <button className="ip-nav-btn" onClick={() => setPeriodeIdx(i => Math.min(i + 1, periodes.length - 1))} disabled={periodeIdx >= periodes.length - 1}>‹</button>
              <span className="ip-periode-naam">{huidigePeriode ? periodeNaam(huidigePeriode, periodeType) : '—'}</span>
              <button className="ip-nav-btn" onClick={() => setPeriodeIdx(i => Math.max(i - 1, 0))} disabled={periodeIdx <= 0}>›</button>
            </div>
          </div>

          {/* Rechts: prestatie-indicatoren */}
          <div className="ip-prestatie-panel">
            <div className="ip-panel-header">
              <span className="ip-section-label">PRESTATIE-INDICATOREN (Y-AS)</span>
              <span className="ip-actief-count">{aantalActief('prestatie')} actief</span>
            </div>
            <div className="ip-ind-lijst">
              {prestatieDoelen.map(md => {
                const ind = indicatoren.find(i => i.id === md.domeinIndicatorId);
                const meting = metingVoorDoel(md.id);
                const delta = trend(md.id);
                const editingThis = metingInput?.doelId === md.id;
                const isActief = !!meting;
                return (
                  <div key={md.id} className={`ip-ind-item ${isActief ? 'actief' : ''}`}>
                    <div className="ip-ind-top">
                      <span className={`ip-dot ${isActief ? 'actief' : ''}`} />
                      <span className="ip-ind-naam">{ind?.indicatorNaam ?? md.indicatorNaam}</span>
                      {isActief && <span className="ip-actief-badge">actief</span>}
                      <button className="ip-deact-btn" onClick={() => deactiveerDoel(md)} title="Deactiveren">×</button>
                    </div>
                    <div className="ip-ind-meta">
                      Norm: {normLabel(md)} · Gewicht: {md.gewicht}
                    </div>
                    {isActief && !editingThis && (
                      <div className="ip-ind-waarde-row">
                        <span className="ip-ist-waarde">{meting!.waarde} {ind?.eenheid}</span>
                        {delta !== null && (
                          <span className={`ip-trend ${(md.normRichting === 'lagerisbeter' ? delta < 0 : delta > 0) ? 'beter' : 'slechter'}`}>
                            {delta < 0 ? '↓' : '↑'} {Math.abs(delta)} {ind?.eenheid}
                          </span>
                        )}
                        <button className="ip-meting-link" onClick={() => setMetingInput({ doelId: md.id, waarde: String(meting!.waarde) })}>bewerken</button>
                      </div>
                    )}
                    {editingThis ? (
                      <input
                        className="ip-meting-input"
                        autoFocus
                        defaultValue={meting?.waarde ?? ''}
                        placeholder={`waarde in ${ind?.eenheid ?? ''}`}
                        onKeyDown={e => { if (e.key === 'Enter') slaMetingOp(md.id, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setMetingInput(null); }}
                        onBlur={e => slaMetingOp(md.id, e.target.value)}
                      />
                    ) : !isActief ? (
                      <button className="ip-meting-link" onClick={() => setMetingInput({ doelId: md.id, waarde: '' })}>+ meting toevoegen</button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <button className="ip-add-btn" onClick={() => openNieuwDoel('prestatie')}>
              + indicator toevoegen
            </button>
          </div>

          {/* Inrichtingsindicatoren (X-as) */}
          <div className="ip-inrichting-panel">
            <div className="ip-panel-header">
              <span className="ip-section-label">INRICHTINGSINDICATOREN (X-AS)</span>
              <button className="ip-add-sm-btn" onClick={() => openNieuwDoel('inrichting')}>+ toevoegen</button>
            </div>
            <div className="ip-cards-grid">
              {inrichtingDoelen.map(md => {
                const ind = indicatoren.find(i => i.id === md.domeinIndicatorId);
                const meting = metingVoorDoel(md.id);
                const editingThis = metingInput?.doelId === md.id;
                const isActief = !!meting;
                return (
                  <div key={md.id} className={`ip-ind-card ${isActief ? 'actief' : ''}`}>
                    <div className="ip-card-top">
                      <span className="ip-ind-naam">{ind?.indicatorNaam ?? md.indicatorNaam}</span>
                      <span className={`ip-dot ${isActief ? 'actief' : ''}`} />
                    </div>
                    <div className="ip-ind-meta">Norm: {normLabel(md)}</div>
                    {isActief && !editingThis && (
                      <>
                        <div className="ip-card-waarde">{meting!.waarde}{ind?.eenheid}</div>
                        <button className="ip-meting-link" onClick={() => setMetingInput({ doelId: md.id, waarde: String(meting!.waarde) })}>+ meting</button>
                      </>
                    )}
                    {editingThis ? (
                      <input
                        className="ip-meting-input"
                        autoFocus
                        defaultValue={meting?.waarde ?? ''}
                        placeholder={ind?.eenheid ?? 'waarde'}
                        onKeyDown={e => { if (e.key === 'Enter') slaMetingOp(md.id, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setMetingInput(null); }}
                        onBlur={e => slaMetingOp(md.id, e.target.value)}
                      />
                    ) : !isActief ? (
                      <button className="ip-meting-link" onClick={() => setMetingInput({ doelId: md.id, waarde: '' })}>+ meting</button>
                    ) : null}
                  </div>
                );
              })}
              {/* Extra kaart: indicator toevoegen */}
              <div className="ip-ind-card ip-card-add" onClick={() => openNieuwDoel('inrichting')}>
                <span>+ indicator<br />toevoegen</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: nieuw metingsdoel */}
      {nieuwDoelModal && (
        <Modal
          title={`Indicator toevoegen (${nieuwDoelModal})`}
          onClose={() => setNieuwDoelModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setNieuwDoelModal(null)}>Annuleren</button><button className="btn-primary" onClick={slaDoelOp}>Toevoegen</button></>}
        >
          <div className="form-row">
            <label>Indicator</label>
            <select value={doelForm.domeinIndicatorId} onChange={e => setDoelForm(f => ({ ...f, domeinIndicatorId: +e.target.value }))}>
              <option value={0}>— kies indicator —</option>
              {beschikbareIndicatoren(nieuwDoelModal).map(i => (
                <option key={i.id} value={i.id}>{i.indicatorNaam} ({i.eenheid})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-row">
              <label>Normwaarde</label>
              <input type="number" value={doelForm.normWaarde} onChange={e => setDoelForm(f => ({ ...f, normWaarde: +e.target.value }))} step="0.01" />
            </div>
            <div className="form-row">
              <label>Richting</label>
              <select value={doelForm.normRichting} onChange={e => setDoelForm(f => ({ ...f, normRichting: e.target.value }))}>
                {NORM_RICHTING.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Gewicht</label>
              <input type="number" value={doelForm.gewicht} onChange={e => setDoelForm(f => ({ ...f, gewicht: +e.target.value }))} step="0.1" min="0" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
