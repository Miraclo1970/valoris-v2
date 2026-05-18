import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getStrategie, getPeriodes, type Strategie, type HuidigePeriode } from '../api/client';
import { MatrixChart } from '../components/MatrixChart';
import './StrategiePage.css';


function formatPeriode(p: HuidigePeriode): string {
  const start = new Date(p.startdatum);
  if (p.type === 'jaar') return `${start.getFullYear()}`;
  if (p.type === 'kwartaal') {
    const q = Math.ceil((start.getMonth() + 1) / 3);
    return `Q${q} ${start.getFullYear()}`;
  }
  return start.toLocaleDateString('nl-NL', { month: 'short', year: 'numeric' });
}

export function StrategiePage() {
  const { domeinId } = useParams<{ domeinId: string }>();
  const id = parseInt(domeinId!);
  const navigate = useNavigate();
  const location = useLocation();

  const [periodes, setPeriodes] = useState<HuidigePeriode[]>([]);
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<number | undefined>();
  const [strategie, setStrategie] = useState<Strategie | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPeriodes(id).then(ps => {
      setPeriodes(ps);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setSelectedIds([]);          // reset selectie bij nieuwe navigatie
    getStrategie(id, selectedPeriodeId)
      .then(s => {
        setStrategie(s);
        setSelectedIds(s.zaaksoorten.map(z => z.zaaksoortId));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // location.key garandeert een nieuwe fetch bij elke navigatie naar deze pagina
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedPeriodeId, location.key]);

  if (loading) return <div className="sp-loading">Laden…</div>;
  if (!strategie) return null;

  if (strategie.zaaksoorten.length === 0) {
    return (
      <div className="sp-root">
        <div className="sp-leeg-staat">
          <div className="sp-leeg-icoon">📋</div>
          <h2>Dit domein heeft nog geen zaaksoorten</h2>
          <p>Voeg zaaksoorten, indicatoren en metingen toe via Inrichting om de strategiematrix te vullen.</p>
          <a href={`/inrichting/${id}`} className="btn-primary" style={{ display: 'inline-block', marginTop: 'var(--space-4)', padding: '10px 24px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: '#fff', background: 'var(--color-primary)', fontWeight: 600 }}>
            Ga naar Inrichting →
          </a>
        </div>
      </div>
    );
  }

  const heeftMetingen = strategie.zaaksoorten.some(z => z.heeftMetingen);
  if (!heeftMetingen) {
    // Toon wel de zaaksoorten-strip maar geen matrix — geef uitleg
  }

  const toggleSelectie = (zaaksoortId: number) => {
    setSelectedIds(prev =>
      prev.includes(zaaksoortId) ? prev.filter(id => id !== zaaksoortId) : [...prev, zaaksoortId]
    );
  };

  const selected = strategie.zaaksoorten.filter(z => selectedIds.includes(z.zaaksoortId));
  const prestatieIndicatoren = [...new Map(
    strategie.zaaksoorten.flatMap(z => z.metingsdoelen)
      .filter(m => m.indicatorType === 'prestatie')
      .map(m => [m.indicatorNaam, m])
  ).values()];
  const inrichtingIndicatoren = [...new Map(
    strategie.zaaksoorten.flatMap(z => z.metingsdoelen)
      .filter(m => m.indicatorType === 'inrichting')
      .map(m => [m.indicatorNaam, m])
  ).values()];

  // Bottom panels
  const waardeToevoegen = selected.filter(z =>
    z.heeftMetingen && (z.vectorPrestatieScore - z.prestatieScore > 2 || z.vectorInrichtingScore - z.inrichtingScore > 2)
  );
  const lageWaarde = selected.filter(z =>
    z.heeftMetingen && z.istScore < strategie.interventiedrempel && !waardeToevoegen.includes(z)
  );
  const ontbreekt = selected.filter(z => !z.heeftMetingen);

  return (
    <div className="sp-root">
      {/* Klantreis selector strip */}
      <div className="sp-selector-wrap">
        <div className="sp-selector-header">
          <span className="sp-section-label">ZAAKSOORTEN</span>
          <div className="sp-selector-right">
            {periodes.length > 0 && (
              <select
                className="sp-periode-select"
                value={selectedPeriodeId ?? ''}
                onChange={e => setSelectedPeriodeId(e.target.value ? parseInt(e.target.value) : undefined)}
              >
                <option value="">Huidige periode</option>
                {periodes.map(p => (
                  <option key={p.id} value={p.id}>{formatPeriode(p)}</option>
                ))}
              </select>
            )}
            <span className="sp-selector-count">{selectedIds.length} geselecteerd</span>
          </div>
        </div>
        <div className="sp-selector-strip">
          {strategie.zaaksoorten.map((z, i) => {
            const isSelected = selectedIds.includes(z.zaaksoortId);
            return (
              <div key={z.zaaksoortId} className="sp-zaak-wrap">
                <div
                  className={`sp-zaak-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleSelectie(z.zaaksoortId)}
                >
                  <input
                    type="checkbox"
                    className="sp-zaak-check"
                    checked={isSelected}
                    readOnly
                  />
                  {z.icoon && <span className="sp-zaak-icoon">{z.icoon}</span>}
                  <span className="sp-zaak-naam">{z.zaaksoortNaam}</span>
                  {z.behandeling && <span className="sp-zaak-behandeling">{z.behandeling}</span>}
                </div>
                {i < strategie.zaaksoorten.length - 1 && <span className="sp-zaak-arrow">›</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Driekoloms: indicatoren | matrix | geselecteerd */}
      <div className="sp-matrix-area">
        {/* Links: indicatoren */}
        <div className="sp-ind-panel">
          <div className="sp-ind-groep">
            <p className="sp-section-label">PRESTATIE (Y-AS)</p>
            {prestatieIndicatoren.map(ind => {
              const actief = selected.some(z =>
                z.metingsdoelen.some(m => m.indicatorNaam === ind.indicatorNaam && m.istWaarde !== null)
              );
              return (
                <div key={ind.indicatorNaam} className="sp-ind-rij">
                  <span className={`sp-ind-dot ${actief ? 'actief' : ''}`} />
                  <span className="sp-ind-naam">{ind.indicatorNaam}</span>
                </div>
              );
            })}
          </div>
          <div className="sp-ind-groep">
            <p className="sp-section-label">INRICHTING (X-AS)</p>
            {inrichtingIndicatoren.map(ind => {
              const actief = selected.some(z =>
                z.metingsdoelen.some(m => m.indicatorNaam === ind.indicatorNaam && m.istWaarde !== null)
              );
              return (
                <div key={ind.indicatorNaam} className="sp-ind-rij">
                  <span className={`sp-ind-dot ${actief ? 'actief' : ''}`} />
                  <span className="sp-ind-naam">{ind.indicatorNaam}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Midden: matrix */}
        <div className="sp-chart-wrap">
          {selected.length === 0 ? (
            <div className="sp-chart-leeg">Selecteer minimaal één zaaksoort.</div>
          ) : (
            <MatrixChart
              zaaksoorten={strategie.zaaksoorten}
              selectedIds={selectedIds}
              interventiedrempel={strategie.interventiedrempel}
            />
          )}
          <p className="sp-chart-voetnoot">
            X/Y = composiet van actieve indicatoren, genormaliseerd 0–100
          </p>
        </div>

        {/* Rechts: geselecteerd + legenda */}
        <div className="sp-detail-panel">
          <p className="sp-section-label">GESELECTEERD</p>
          <div className="sp-geselecteerd-lijst">
            {selected.map(z => {
              const gap = Math.round(z.sollScore - z.istScore);
              return (
                <div key={z.zaaksoortId} className="sp-geselecteerd-item">
                  <div className="sp-ges-naam">
                    {z.icoon && <span>{z.icoon}</span>}
                    <strong>{z.zaaksoortNaam}</strong>
                    {z.behandeling && <span className="sp-ges-behandeling">{z.behandeling}</span>}
                  </div>
                  <div className="sp-ges-scores">
                    IST <strong>{z.istScore}</strong>
                    {' · '}SOLL <strong>{z.sollScore}</strong>
                    {' · '}GAP <span className="sp-gap">{gap}</span>
                  </div>
                  {z.gekoppeldeVerandering && (
                    <div className="sp-ges-verandering">{z.gekoppeldeVerandering}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sp-legenda">
            <p className="sp-section-label">LEGENDA</p>
            <div className="sp-legenda-item">● IST (laatste meting)</div>
            <div className="sp-legenda-item">○ SOLL (norm)</div>
            <div className="sp-legenda-item">→ Verandervector</div>
            <div className="sp-legenda-item sp-legenda-dashed">- - - GAP (afstand tot norm)</div>
          </div>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="sp-bottom-panels">
        <div className="sp-bottom-panel sp-panel-groen">
          <p className="sp-panel-titel">Waarde toevoegen ({waardeToevoegen.length})</p>
          {waardeToevoegen.length === 0
            ? <p className="sp-panel-leeg">Geen</p>
            : waardeToevoegen.map(z => (
              <div key={z.zaaksoortId} className="sp-panel-item">
                <div className="sp-panel-naam">{z.icoon} {z.zaaksoortNaam}</div>
                <div className="sp-panel-sub">
                  +{Math.round((z.vectorPrestatieScore + z.vectorInrichtingScore) / 2 - (z.prestatieScore + z.inrichtingScore) / 2)} indexpunten verwacht
                </div>
                <button className="sp-doorgaan-btn" onClick={() => navigate(`/veranderingen/${id}`)}>
                  Doorgaan
                </button>
              </div>
            ))
          }
        </div>
        <div className="sp-bottom-panel sp-panel-rood">
          <p className="sp-panel-titel">Lage waarde ({lageWaarde.length})</p>
          {lageWaarde.length === 0
            ? <p className="sp-panel-leeg">Geen</p>
            : lageWaarde.map(z => (
              <div key={z.zaaksoortId} className="sp-panel-naam">{z.icoon} {z.zaaksoortNaam}</div>
            ))
          }
        </div>
        <div className="sp-bottom-panel sp-panel-oranje">
          <p className="sp-panel-titel">Ontbreekt ({ontbreekt.length})</p>
          {ontbreekt.length === 0
            ? <p className="sp-panel-leeg">Geen</p>
            : ontbreekt.map(z => (
              <div key={z.zaaksoortId} className="sp-panel-naam">{z.icoon} {z.zaaksoortNaam}</div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
