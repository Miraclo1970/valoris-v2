import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getZaaksoorten, getIndicatoren, getAlleIndicatoren, koppelIndicator,
  getMetingsdoelen, getMetingen,
  createMetingsdoel, updateMetingsdoel, createMeting, updateMeting,
  getPeriodes, getDomeinen,
  createZaaksoort, updateZaaksoort, herordZaaksoorten,
  type Zaaksoort, type DomeinIndicator, type Indicator, type Metingsdoel, type Meting,
  type HuidigePeriode, type MetingsdoelCreate, type MetingsdoelUpdate, type ZaaksoortCreate,
} from '../api/client';
import { Modal } from '../components/Modal';
import './InrichtingPage.css';

const NORM_RICHTING = [
  { value: 'hogerisbeter', label: 'Hoger is beter (>)' },
  { value: 'lagerisbeter', label: 'Lager is beter (<)' },
];

const BRONNEN = ['Handmatig', 'Systeem', 'Import', 'Berekend'];

function stoplicht(waarde: number, norm: number, richting: string): 'groen' | 'oranje' | 'rood' {
  if (norm === 0) return 'groen';
  const ratio = richting === 'lagerisbeter' ? norm / waarde : waarde / norm;
  if (ratio >= 1) return 'groen';
  if (ratio >= 0.8) return 'oranje';
  return 'rood';
}

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

  const [metingInput, setMetingInput] = useState<{ doelId: number; waarde: string; bron: string } | null>(null);
  const [nieuwDoelModal, setNieuwDoelModal] = useState<'prestatie' | 'inrichting' | null>(null);
  const [doelForm, setDoelForm] = useState<MetingsdoelCreate>({ domeinIndicatorId: 0, zaaksoortId: 0, normWaarde: 0, normRichting: 'hogerisbeter', gewicht: 1 });
  const [bewerkDoel, setBewerkDoel] = useState<Metingsdoel | null>(null);
  const [bewerkForm, setBewerkForm] = useState<MetingsdoelUpdate>({ normWaarde: 0, normRichting: 'hogerisbeter', gewicht: 1, actief: true });

  // Zaaksoort beheer
  const leegZaaksoortForm: ZaaksoortCreate = { naam: '', omschrijving: '', icoon: '', behandeling: '' };
  const [zaaksoortModal, setZaaksoortModal] = useState<'nieuw' | Zaaksoort | null>(null);
  const [zaaksoortForm, setZaaksoortForm] = useState<ZaaksoortCreate>(leegZaaksoortForm);

  // Drag-and-drop volgorde
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const [fout, setFout] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  // Welke periode is vandaag? (voor "huidig" markering in navigatie)
  const today = new Date();
  const echteHuidigePeriode = periodes.find(p =>
    new Date(p.startdatum) <= today && today <= new Date(p.einddatum)
  ) ?? null;

  const selectedZaaksoort = zaaksoorten.find(z => z.id === selectedZaaksoortId);
  const doelen = metingsdoelen.filter(m => m.zaaksoortId === selectedZaaksoortId);

  const metingVoorDoel = (doelId: number, periodeId?: number): Meting | undefined =>
    metingen.find(m => m.metingsdoelId === doelId && m.periodeId === (periodeId ?? huidigePeriode?.id));

  const trend = (doelId: number): number | null => {
    const huidig = metingVoorDoel(doelId);
    const vorig = vorigePeriode ? metingVoorDoel(doelId, vorigePeriode.id) : undefined;
    if (!huidig || !vorig) return null;
    return Math.round((huidig.waarde - vorig.waarde) * 1000) / 1000;
  };

  const aantalGemeten = (type: 'prestatie' | 'inrichting') =>
    doelen
      .filter(m => {
        const ind = indicatoren.find(i => i.id === m.domeinIndicatorId);
        return ind?.type === type && !!metingVoorDoel(m.id);
      }).length;

  const aantalRelevant = (type: 'prestatie' | 'inrichting') =>
    doelen.filter(m => {
      const ind = indicatoren.find(i => i.id === m.domeinIndicatorId);
      return ind?.type === type;
    }).length;

  const slaMetingOp = async (doelId: number, waardeStr: string) => {
    const waarde = parseFloat(waardeStr.replace(',', '.'));
    if (isNaN(waarde)) { setFout('Voer een geldige waarde in.'); return; }
    if (!huidigePeriode) {
      setFout(`Geen ${periodeType} gevonden. Maak eerst periodes aan via Beheer → Periodes.`);
      return;
    }
    const bron = metingInput?.bron ?? 'Handmatig';
    setSaving(true); setFout(null);
    try {
      const bestaand = metingVoorDoel(doelId);
      if (bestaand) {
        await updateMeting(bestaand.id, { waarde, datum: bestaand.datum, bron, gevalideerd: bestaand.gevalideerd });
      } else {
        await createMeting({ metingsdoelId: doelId, periodeId: huidigePeriode.id, waarde, datum: new Date().toISOString(), bron });
      }
      setMetingInput(null);
      await laad();
    } catch {
      setFout('Meting opslaan mislukt. Controleer je verbinding en probeer opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  const valideerMeting = async (doelId: number) => {
    const meting = metingVoorDoel(doelId);
    if (!meting) return;
    setSaving(true); setFout(null);
    try {
      await updateMeting(meting.id, { waarde: meting.waarde, datum: meting.datum, bron: meting.bron, gevalideerd: true });
      await laad();
    } catch {
      setFout('Valideren mislukt. Probeer opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  const slaDoelOp = async () => {
    if (!selectedZaaksoortId) return;
    setSaving(true); setFout(null);
    try {
      let domeinIndicatorId = doelForm.domeinIndicatorId;
      // Negatieve ID = bibliotheek-indicator die nog niet gekoppeld is → auto-koppelen
      if (domeinIndicatorId < 0) {
        const bibliotheekId = -domeinIndicatorId;
        domeinIndicatorId = await koppelIndicator(id, bibliotheekId);
      }
      await createMetingsdoel({ ...doelForm, domeinIndicatorId, zaaksoortId: selectedZaaksoortId });
      await laad();
      setNieuwDoelModal(null);
    } catch {
      setFout('Indicator toevoegen mislukt. Controleer je verbinding en probeer opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  const deactiveerDoel = async (md: Metingsdoel) => {
    setSaving(true); setFout(null);
    try {
      await updateMetingsdoel(md.id, { normWaarde: md.normWaarde, normRichting: md.normRichting, gewicht: md.gewicht, actief: false });
      await laad();
    } catch {
      setFout('Deactiveren mislukt. Probeer opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  const openBewerkDoel = (md: Metingsdoel) => {
    setBewerkForm({ normWaarde: md.normWaarde, normRichting: md.normRichting, gewicht: md.gewicht, actief: md.actief });
    setBewerkDoel(md);
  };

  const slaBewerktDoelOp = async () => {
    if (!bewerkDoel) return;
    setSaving(true); setFout(null);
    try {
      await updateMetingsdoel(bewerkDoel.id, bewerkForm);
      await laad();
      setBewerkDoel(null);
    } catch {
      setFout('Opslaan mislukt. Controleer je verbinding en probeer opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  // Altijd alle bibliotheek-indicatoren van dit type aanbieden die nog niet als metingsdoel voor deze zaaksoort bestaan.
  // Als de indicator al aan het domein gekoppeld is, gebruik die DomeinIndicator; anders negatieve ID (auto-koppelen bij opslaan).
  const beschikbareIndicatoren = (type: 'prestatie' | 'inrichting') =>
    bibliotheek
      .filter(b => b.type === type)
      .filter(b => !doelen.some(d => {
        const di = indicatoren.find(i => i.id === d.domeinIndicatorId);
        return di?.indicatorId === b.id;
      }))
      .map(b => {
        const bestaand = indicatoren.find(i => i.indicatorId === b.id);
        return bestaand ?? {
          id: -b.id, // negatief = nog niet gekoppeld, wordt auto-gekoppeld bij opslaan
          domeinId: id, indicatorId: b.id, indicatorNaam: b.naam,
          type: b.type, eenheid: b.eenheid, aggregatiewijze: b.aggregatiewijze, actief: true,
        } as DomeinIndicator;
      });

  const openNieuwDoel = (type: 'prestatie' | 'inrichting', preSelectId?: number) => {
    const defaultId = preSelectId ?? beschikbareIndicatoren(type)[0]?.id ?? 0;
    setDoelForm({ domeinIndicatorId: defaultId, zaaksoortId: selectedZaaksoortId ?? 0, normWaarde: 0, normRichting: 'hogerisbeter', gewicht: 1 });
    setNieuwDoelModal(type);
  };

  const openNieuwZaaksoort = () => {
    setZaaksoortForm(leegZaaksoortForm);
    setZaaksoortModal('nieuw');
  };

  const openBewerkZaaksoort = (z: Zaaksoort, e: React.MouseEvent) => {
    e.stopPropagation(); // voorkom chip-selectie
    setZaaksoortForm({ naam: z.naam, omschrijving: z.omschrijving, icoon: z.icoon ?? '', behandeling: z.behandeling ?? '' });
    setZaaksoortModal(z);
  };

  const slaZaaksoortOp = async () => {
    setSaving(true); setFout(null);
    try {
      if (zaaksoortModal === 'nieuw') {
        const nieuweId = await createZaaksoort(id, zaaksoortForm);
        setZaaksoortModal(null);
        await laad();
        setSelectedZaaksoortId(nieuweId);
      } else if (zaaksoortModal) {
        await updateZaaksoort(id, zaaksoortModal.id, zaaksoortForm);
        setZaaksoortModal(null);
        await laad();
      }
    } catch {
      setFout('Zaaksoort opslaan mislukt. Probeer opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, zaaksoortId: number) => {
    setDragId(zaaksoortId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, zaaksoortId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (zaaksoortId !== dragId) setDragOverId(zaaksoortId);
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const herordend = [...zaaksoorten];
    const fromIdx = herordend.findIndex(z => z.id === dragId);
    const toIdx = herordend.findIndex(z => z.id === targetId);
    const [moved] = herordend.splice(fromIdx, 1);
    herordend.splice(toIdx, 0, moved);
    setZaaksoorten(herordend); // optimistisch bijwerken
    setDragId(null);
    setDragOverId(null);
    try {
      await herordZaaksoorten(id, herordend.map(z => z.id));
    } catch {
      setFout('Volgorde aanpassen mislukt.');
      await laad(); // terugdraaien bij fout
    }
  };

  const handleDragEnd = () => { setDragId(null); setDragOverId(null); };

  return (
    <div className="ip-root">
      {fout && (
        <div className="ip-fout-banner">
          <span>{fout}</span>
          <button className="ip-fout-sluiten" onClick={() => setFout(null)}>✕</button>
        </div>
      )}
      {/* Klantreis strip */}
      <div className="ip-klantreis-wrap">
        <div className="ip-klantreis-header">
          <span className="ip-section-label">KLANTREIS (ZAAKSOORTEN)</span>
          <button className="ip-add-sm-btn" onClick={openNieuwZaaksoort} title="Nieuwe zaaksoort">+ Zaaksoort</button>
        </div>
        <div className="ip-klantreis-strip">
          {zaaksoorten.map((z, i) => (
            <div
              key={z.id}
              className="ip-zaak-wrap"
              draggable
              ref={dragId === z.id ? dragNode : null}
              onDragStart={e => handleDragStart(e, z.id)}
              onDragOver={e => handleDragOver(e, z.id)}
              onDrop={e => handleDrop(e, z.id)}
              onDragEnd={handleDragEnd}
            >
              <div
                className={[
                  'ip-zaak-chip',
                  selectedZaaksoortId === z.id ? 'selected' : '',
                  dragId === z.id ? 'dragging' : '',
                  dragOverId === z.id ? 'drag-over' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedZaaksoortId(z.id)}
              >
                <span className="ip-zaak-drag-handle" title="Slepen om te herordenen">⠿</span>
                {z.icoon && <span className="ip-zaak-icoon">{z.icoon}</span>}
                <span className="ip-zaak-naam">{z.naam}</span>
                {z.behandeling && <span className="ip-zaak-behandeling">{z.behandeling}</span>}
                <button
                  className="ip-zaak-edit-btn"
                  onClick={e => openBewerkZaaksoort(z, e)}
                  title="Zaaksoort bewerken"
                >✎</button>
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
                <span>{aantalGemeten('prestatie')}/{aantalRelevant('prestatie')} prestatie gemeten</span>
                <span>{aantalGemeten('inrichting')}/{aantalRelevant('inrichting')} inrichting gemeten</span>
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
              <span className="ip-periode-naam">
                {huidigePeriode ? periodeNaam(huidigePeriode, periodeType) : '—'}
                {huidigePeriode && echteHuidigePeriode?.id === huidigePeriode.id && (
                  <span className="ip-huidig-badge">nu</span>
                )}
              </span>
              <button className="ip-nav-btn" onClick={() => setPeriodeIdx(i => Math.max(i - 1, 0))} disabled={periodeIdx <= 0}>›</button>
            </div>
          </div>

          {/* Rechts: prestatie-indicatoren */}
          <div className="ip-prestatie-panel">
            <div className="ip-panel-header">
              <span className="ip-section-label">
                PRESTATIE-INDICATOREN (Y-AS)
                <span className="ip-legenda-tip" title="Stoplicht: 🟢 waarde ≥ norm  |  🟠 80–99% van norm  |  🔴 onder 80% van norm">ⓘ</span>
              </span>
              <span className="ip-actief-count">{aantalGemeten('prestatie')}/{aantalRelevant('prestatie')} gemeten</span>
            </div>
            <div className="ip-ind-lijst">
              {indicatoren
                .filter(ind => ind.type === 'prestatie')
                .sort((a, b) => {
                  const aActief = doelen.some(d => d.domeinIndicatorId === a.id) ? 0 : 1;
                  const bActief = doelen.some(d => d.domeinIndicatorId === b.id) ? 0 : 1;
                  return aActief - bActief;
                })
                .map(ind => {
                const md = doelen.find(d => d.domeinIndicatorId === ind.id) ?? null;

                /* ── Staat 1: Beschikbaar — gekoppeld aan domein, nog geen metingsdoel ── */
                if (!md) {
                  return (
                    <div key={ind.id} className="ip-ind-item grijs" onClick={() => openNieuwDoel('prestatie', ind.id)} title="Klik om toe te voegen aan deze zaaksoort">
                      <div className="ip-ind-top">
                        <span className="ip-dot" />
                        <span className="ip-ind-naam">{ind.indicatorNaam}</span>
                      </div>
                      <div className="ip-activeer-hint">Klik om toe te voegen</div>
                    </div>
                  );
                }

                /* ── Staat 2 & 3: Relevant / Gemeten ── */
                const meting = metingVoorDoel(md.id);
                const delta = trend(md.id);
                const editingThis = metingInput?.doelId === md.id;
                const sl = meting ? stoplicht(meting.waarde, md.normWaarde, md.normRichting) : null;
                const itemClass = sl ? `ip-ind-item sl-${sl}` : 'ip-ind-item relevant';
                const dotClass = sl ? `ip-dot sl-dot-${sl}` : 'ip-dot ip-dot-relevant';

                return (
                  <div key={md.id} className={itemClass}>
                    <div className="ip-ind-top">
                      <span className={dotClass} />
                      <span className="ip-ind-naam">{ind.indicatorNaam}</span>
                      {sl && <span className={`ip-actief-badge sl-badge-${sl}`}>gemeten</span>}
                      <button className="ip-edit-btn" onClick={() => openBewerkDoel(md)} title="Norm/gewicht bewerken">✎</button>
                      <button className="ip-deact-btn" onClick={() => deactiveerDoel(md)} title="Deactiveren">×</button>
                    </div>
                    <div className="ip-ind-meta">
                      Norm: {normLabel(md)} · Gewicht: {md.gewicht}
                    </div>
                    {meting && !editingThis && (
                      <div className="ip-ind-waarde-row">
                        <span className="ip-ist-waarde">{meting.waarde} {ind.eenheid}</span>
                        {delta !== null && (
                          <span className={`ip-trend ${(md.normRichting === 'lagerisbeter' ? delta < 0 : delta > 0) ? 'beter' : 'slechter'}`}>
                            {delta < 0 ? '↓' : '↑'} {Math.abs(delta)} {ind.eenheid}
                          </span>
                        )}
                        {meting.gevalideerd
                          ? <span className="ip-gevalideerd-badge" title="Gevalideerd">✓ gevalideerd</span>
                          : <button className="ip-valideer-btn" onClick={() => valideerMeting(md.id)} title="Meting valideren">✓</button>
                        }
                        <button className="ip-meting-link" onClick={() => setMetingInput({ doelId: md.id, waarde: String(meting.waarde), bron: meting.bron })}>bewerken</button>
                      </div>
                    )}
                    {editingThis ? (
                      <div className="ip-meting-blok">
                        <div className="ip-meting-rij">
                          <label className="ip-meting-label">Waarde ({ind.eenheid ?? '—'})</label>
                          <input
                            className="ip-meting-input"
                            autoFocus
                            type="number"
                            value={metingInput?.waarde ?? ''}
                            placeholder="0"
                            onChange={e => setMetingInput(m => m ? { ...m, waarde: e.target.value } : null)}
                            onKeyDown={e => { if (e.key === 'Enter') slaMetingOp(md.id, metingInput?.waarde ?? ''); if (e.key === 'Escape') setMetingInput(null); }}
                          />
                        </div>
                        <div className="ip-meting-rij">
                          <label className="ip-meting-label">Bron</label>
                          <select
                            className="ip-bron-select"
                            value={metingInput?.bron ?? 'Handmatig'}
                            onChange={e => setMetingInput(m => m ? { ...m, bron: e.target.value } : null)}
                          >
                            {BRONNEN.map(b => <option key={b}>{b}</option>)}
                          </select>
                        </div>
                        <div className="ip-meting-acties">
                          <button className="ip-meting-annuleer-btn" onClick={() => setMetingInput(null)}>Annuleren</button>
                          <button className="ip-meting-opslaan-btn" onClick={() => slaMetingOp(md.id, metingInput?.waarde ?? '')}>Opslaan</button>
                        </div>
                      </div>
                    ) : !meting ? (
                      huidigePeriode
                        ? <button className="ip-meting-link" onClick={() => setMetingInput({ doelId: md.id, waarde: '', bron: 'Handmatig' })}>+ meting invoeren</button>
                        : <span className="ip-geen-periode-hint">Geen periode — maak kwartalen/maanden aan via Beheer</span>
                    ) : null}
                  </div>
                );
              })}
              {indicatoren.filter(ind => ind.type === 'prestatie').length === 0 && (
                <div className="ip-leeg-staat">
                  Nog geen prestatie-indicatoren gekoppeld aan dit domein.<br />
                  Ga naar <strong>Beheer → Ind. koppelen</strong> om indicatoren toe te voegen.
                </div>
              )}
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
              {indicatoren.filter(ind => ind.type === 'inrichting').length === 0 && (
                <div className="ip-leeg-staat" style={{ gridColumn: '1 / -1' }}>
                  Nog geen inrichtingsindicatoren gekoppeld aan dit domein.<br />
                  Ga naar <strong>Beheer → Ind. koppelen</strong> om indicatoren toe te voegen.
                </div>
              )}
              {indicatoren
                .filter(ind => ind.type === 'inrichting')
                .sort((a, b) => {
                  const aActief = doelen.some(d => d.domeinIndicatorId === a.id) ? 0 : 1;
                  const bActief = doelen.some(d => d.domeinIndicatorId === b.id) ? 0 : 1;
                  return aActief - bActief;
                })
                .map(ind => {
                const md = doelen.find(d => d.domeinIndicatorId === ind.id) ?? null;

                /* ── Staat 1: Beschikbaar ── */
                if (!md) {
                  return (
                    <div key={ind.id} className="ip-ind-card grijs" onClick={() => openNieuwDoel('inrichting', ind.id)} title="Klik om toe te voegen aan deze zaaksoort">
                      <div className="ip-card-top">
                        <span className="ip-ind-naam">{ind.indicatorNaam}</span>
                        <div className="ip-card-top-right">
                          <span className="ip-dot" />
                        </div>
                      </div>
                      <div className="ip-activeer-hint">Klik om toe te voegen</div>
                    </div>
                  );
                }

                /* ── Staat 2 & 3: Relevant / Gemeten ── */
                const meting = metingVoorDoel(md.id);
                const editingThis = metingInput?.doelId === md.id;
                const sl = meting ? stoplicht(meting.waarde, md.normWaarde, md.normRichting) : null;
                const cardClass = sl ? `ip-ind-card sl-${sl}` : 'ip-ind-card relevant';
                const dotClass = sl ? `ip-dot sl-dot-${sl}` : 'ip-dot ip-dot-relevant';

                return (
                  <div key={md.id} className={cardClass}>
                    <div className="ip-card-top">
                      <span className="ip-ind-naam">{ind.indicatorNaam}</span>
                      <div className="ip-card-top-right">
                        <span className={dotClass} />
                        <button className="ip-edit-btn" onClick={() => openBewerkDoel(md)} title="Norm/gewicht bewerken">✎</button>
                        <button className="ip-deact-btn" onClick={() => deactiveerDoel(md)} title="Deactiveren">×</button>
                      </div>
                    </div>
                    <div className="ip-ind-meta">Norm: {normLabel(md)}</div>
                    {meting && !editingThis && (
                      <>
                        <div className={`ip-card-waarde ${sl ? `sl-waarde-${sl}` : ''}`}>{meting.waarde}{ind.eenheid}</div>
                        <div className="ip-card-acties">
                          {meting.gevalideerd
                            ? <span className="ip-gevalideerd-badge" title="Gevalideerd">✓</span>
                            : <button className="ip-valideer-btn" onClick={() => valideerMeting(md.id)} title="Meting valideren">✓</button>
                          }
                          <button className="ip-meting-link" onClick={() => setMetingInput({ doelId: md.id, waarde: String(meting.waarde), bron: meting.bron })}>bewerken</button>
                        </div>
                      </>
                    )}
                    {editingThis ? (
                      <div className="ip-meting-blok">
                        <div className="ip-meting-rij">
                          <label className="ip-meting-label">Waarde ({ind.eenheid ?? '—'})</label>
                          <input
                            className="ip-meting-input"
                            autoFocus
                            type="number"
                            value={metingInput?.waarde ?? ''}
                            placeholder="0"
                            onChange={e => setMetingInput(m => m ? { ...m, waarde: e.target.value } : null)}
                            onKeyDown={e => { if (e.key === 'Enter') slaMetingOp(md.id, metingInput?.waarde ?? ''); if (e.key === 'Escape') setMetingInput(null); }}
                          />
                        </div>
                        <div className="ip-meting-rij">
                          <label className="ip-meting-label">Bron</label>
                          <select
                            className="ip-bron-select"
                            value={metingInput?.bron ?? 'Handmatig'}
                            onChange={e => setMetingInput(m => m ? { ...m, bron: e.target.value } : null)}
                          >
                            {BRONNEN.map(b => <option key={b}>{b}</option>)}
                          </select>
                        </div>
                        <div className="ip-meting-acties">
                          <button className="ip-meting-annuleer-btn" onClick={() => setMetingInput(null)}>Annuleren</button>
                          <button className="ip-meting-opslaan-btn" onClick={() => slaMetingOp(md.id, metingInput?.waarde ?? '')}>Opslaan</button>
                        </div>
                      </div>
                    ) : !meting ? (
                      huidigePeriode
                        ? <button className="ip-meting-link" onClick={() => setMetingInput({ doelId: md.id, waarde: '', bron: 'Handmatig' })}>+ meting</button>
                        : <span className="ip-geen-periode-hint">Geen periode</span>
                    ) : null}
                  </div>
                );
              })}
              {/* Extra kaart: indicator toevoegen (alleen als er nog beschikbare indicatoren zijn) */}
              {beschikbareIndicatoren('inrichting').length > 0 && (
                <div className="ip-ind-card ip-card-add" onClick={() => openNieuwDoel('inrichting')}>
                  <span>+ indicator<br />toevoegen</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: zaaksoort aanmaken / bewerken */}
      {zaaksoortModal && (
        <Modal
          title={zaaksoortModal === 'nieuw' ? 'Nieuwe zaaksoort' : `Bewerken — ${(zaaksoortModal as Zaaksoort).naam}`}
          onClose={() => setZaaksoortModal(null)}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setZaaksoortModal(null)} disabled={saving}>Annuleren</button>
              <button className="btn-primary" onClick={slaZaaksoortOp} disabled={saving || !zaaksoortForm.naam}>{saving ? 'Bezig…' : 'Opslaan'}</button>
            </>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label>Naam</label>
              <input autoFocus value={zaaksoortForm.naam} onChange={e => setZaaksoortForm(f => ({ ...f, naam: e.target.value }))} placeholder="bv. Aanvraag vergunning" />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label>Omschrijving</label>
              <input value={zaaksoortForm.omschrijving} onChange={e => setZaaksoortForm(f => ({ ...f, omschrijving: e.target.value }))} placeholder="Korte beschrijving" />
            </div>
            <div className="form-row">
              <label>Icoon (emoji)</label>
              <input value={zaaksoortForm.icoon ?? ''} onChange={e => setZaaksoortForm(f => ({ ...f, icoon: e.target.value }))} placeholder="bv. 🪪" />
            </div>
            <div className="form-row">
              <label>Behandeling</label>
              <select value={zaaksoortForm.behandeling ?? ''} onChange={e => setZaaksoortForm(f => ({ ...f, behandeling: e.target.value }))}>
                <option value="">—</option>
                <option value="Balie">Balie</option>
                <option value="Online">Online</option>
                <option value="Post">Post</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: norm/gewicht bewerken */}
      {bewerkDoel && (() => {
        const ind = indicatoren.find(i => i.id === bewerkDoel.domeinIndicatorId);
        return (
          <Modal
            title={`Bewerken — ${ind?.indicatorNaam ?? bewerkDoel.indicatorNaam}`}
            onClose={() => setBewerkDoel(null)}
            footer={
              <>
                <button className="btn-secondary" onClick={() => setBewerkDoel(null)} disabled={saving}>Annuleren</button>
                <button className="btn-primary" onClick={slaBewerktDoelOp} disabled={saving}>{saving ? 'Bezig…' : 'Opslaan'}</button>
              </>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-row">
                <label>Normwaarde</label>
                <input type="number" value={bewerkForm.normWaarde} onChange={e => setBewerkForm(f => ({ ...f, normWaarde: +e.target.value }))} step="0.01" />
              </div>
              <div className="form-row">
                <label>Richting</label>
                <select value={bewerkForm.normRichting} onChange={e => setBewerkForm(f => ({ ...f, normRichting: e.target.value }))}>
                  {NORM_RICHTING.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>Gewicht</label>
                <input type="number" value={bewerkForm.gewicht} onChange={e => setBewerkForm(f => ({ ...f, gewicht: +e.target.value }))} step="0.1" min="0" />
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Modal: nieuw metingsdoel */}
      {nieuwDoelModal && (
        <Modal
          title={`Indicator toevoegen (${nieuwDoelModal})`}
          onClose={() => setNieuwDoelModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setNieuwDoelModal(null)} disabled={saving}>Annuleren</button><button className="btn-primary" onClick={slaDoelOp} disabled={saving || doelForm.domeinIndicatorId === 0}>{saving ? 'Bezig…' : 'Toevoegen'}</button></>}
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
