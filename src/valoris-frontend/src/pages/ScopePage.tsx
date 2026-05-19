import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getScopeMatrix, createProduct, updateProduct, createProces, updateProces,
  createScope, updateScope, deleteScope, setHoofdproces,
  type ScopeMatrix, type ScopeRegel, type ScopeZaaksoort, type Product, type Proces,
} from '../api/client';
import { Modal } from '../components/Modal';
import './ScopePage.css';

type ScopeType = 'verplicht' | 'optioneel';
const FREQUENTIE_PERIODES = ['maand', 'kwartaal', 'tertiaal', 'jaar'];

export function ScopePage() {
  const { domeinId } = useParams<{ domeinId: string }>();
  const id = Number(domeinId);

  const [matrix, setMatrix] = useState<ScopeMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  // Modals
  const [productModal, setProductModal] = useState<'nieuw' | Product | null>(null);
  const [productForm, setProductForm] = useState({ naam: '', omschrijving: '' });
  const [procesModal, setProcesModal] = useState<'nieuw' | Proces | null>(null);
  const [procesForm, setProcesForm] = useState({ naam: '', omschrijving: '' });
  const [scopeModal, setScopeModal] = useState<{ productId: number; procesId: number; bestaand?: ScopeRegel } | null>(null);
  const [scopeForm, setScopeForm] = useState<{ zaaksoortId: number; type: ScopeType; frequentiePeriode: string; frequentie: string }>({ zaaksoortId: 0, type: 'verplicht', frequentiePeriode: '', frequentie: '' });

  const laad = () => {
    setLoading(true);
    getScopeMatrix(id)
      .then(setMatrix)
      .catch(() => setFout('Laden mislukt.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { laad(); }, [id]);

  // ── Product beheer ──
  const openNieuwProduct = () => { setProductForm({ naam: '', omschrijving: '' }); setProductModal('nieuw'); };
  const openBewerkProduct = (p: Product) => { setProductForm({ naam: p.naam, omschrijving: p.omschrijving }); setProductModal(p); };

  const slaProductOp = async () => {
    if (!productForm.naam) return;
    setSaving(true); setFout(null);
    try {
      if (productModal === 'nieuw') {
        await createProduct(id, { naam: productForm.naam, omschrijving: productForm.omschrijving });
      } else if (productModal) {
        await updateProduct(id, (productModal as Product).id, { naam: productForm.naam, omschrijving: productForm.omschrijving });
      }
      setProductModal(null);
      laad();
    } catch { setFout('Opslaan mislukt.'); }
    finally { setSaving(false); }
  };

  // ── Proces beheer ──
  const openNieuwProces = () => { setProcesForm({ naam: '', omschrijving: '' }); setProcesModal('nieuw'); };
  const openBewerkProces = (p: Proces) => { setProcesForm({ naam: p.naam, omschrijving: p.omschrijving }); setProcesModal(p); };

  const slaProcesOp = async () => {
    if (!procesForm.naam) return;
    setSaving(true); setFout(null);
    try {
      if (procesModal === 'nieuw') {
        await createProces(id, { naam: procesForm.naam, omschrijving: procesForm.omschrijving });
      } else if (procesModal) {
        await updateProces(id, (procesModal as Proces).id, { naam: procesForm.naam, omschrijving: procesForm.omschrijving });
      }
      setProcesModal(null);
      laad();
    } catch { setFout('Opslaan mislukt.'); }
    finally { setSaving(false); }
  };

  // ── Scope cel klikken ──
  const openScopeModal = (productId: number, procesId: number) => {
    const bestaand = matrix?.scopes.find(s => s.productId === productId && s.procesId === procesId);
    setScopeForm({
      zaaksoortId: bestaand?.zaaksoortId ?? 0,
      type: bestaand?.type ?? 'verplicht',
      frequentiePeriode: bestaand?.frequentiePeriode ?? '',
      frequentie: bestaand?.frequentie != null ? String(bestaand.frequentie) : '',
    });
    setScopeModal({ productId, procesId, bestaand });
  };

  const slaScopeOp = async () => {
    if (!scopeModal || scopeForm.zaaksoortId === 0) return;
    setSaving(true); setFout(null);
    try {
      const body = {
        zaaksoortId: scopeForm.zaaksoortId,
        productId: scopeModal.productId,
        procesId: scopeModal.procesId,
        type: scopeForm.type,
        frequentiePeriode: scopeForm.frequentiePeriode || undefined,
        frequentie: scopeForm.frequentie ? parseFloat(scopeForm.frequentie) : undefined,
      };
      if (scopeModal.bestaand) {
        await updateScope(id, scopeModal.bestaand.id, { type: body.type, frequentiePeriode: body.frequentiePeriode, frequentie: body.frequentie });
      } else {
        await createScope(id, body);
      }
      setScopeModal(null);
      laad();
    } catch (e: unknown) {
      const msg = (e as { fout?: string })?.fout ?? 'Opslaan mislukt.';
      setFout(msg);
    }
    finally { setSaving(false); }
  };

  const verwijderScope = async (scopeId: number) => {
    setSaving(true); setFout(null);
    try {
      await deleteScope(id, scopeId);
      setScopeModal(null);
      laad();
    } catch { setFout('Verwijderen mislukt.'); }
    finally { setSaving(false); }
  };

  const stelHoofdprocesIn = async (zaaksoortId: number, hoofdprocesId: number | null) => {
    try { await setHoofdproces(id, zaaksoortId, hoofdprocesId); laad(); }
    catch { setFout('Hoofdproces instellen mislukt.'); }
  };

  if (loading) return <div className="scp-loading">Laden…</div>;
  if (!matrix) return null;

  const { producten, processen, scopes, zaaksoorten } = matrix;

  const scopeVoorCel = (productId: number, procesId: number) =>
    scopes.find(s => s.productId === productId && s.procesId === procesId);

  const zaaksoortVanScope = (s: ScopeRegel): ScopeZaaksoort | undefined =>
    zaaksoorten.find(z => z.id === s.zaaksoortId);

  return (
    <div className="scp-root">
      <div className="scp-header">
        <h1 className="scp-titel">Scope — Product × Proces matrix</h1>
        <p className="scp-subtitel">
          Koppel producten aan processen via zaaksoorten. Elke combinatie mag maar één keer voorkomen.
        </p>
      </div>

      {fout && (
        <div className="scp-fout-banner">
          {fout}
          <button onClick={() => setFout(null)}>✕</button>
        </div>
      )}

      {/* Matrix */}
      {producten.length === 0 || processen.length === 0 ? (
        <div className="scp-leeg">
          <p>Voeg eerst producten én processen toe om de matrix te vullen.</p>
        </div>
      ) : (
        <div className="scp-matrix-wrap">
          <table className="scp-matrix">
            <thead>
              <tr>
                <th className="scp-corner">
                  <span className="scp-y-label">Product ↓</span>
                  <span className="scp-x-label">Proces →</span>
                </th>
                {processen.map(p => (
                  <th key={p.id} className="scp-proc-header">
                    <button className="scp-header-btn" onClick={() => openBewerkProces(p)}>{p.naam}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {producten.map(product => (
                <tr key={product.id}>
                  <td className="scp-prod-header">
                    <button className="scp-header-btn" onClick={() => openBewerkProduct(product)}>{product.naam}</button>
                  </td>
                  {processen.map(proces => {
                    const scope = scopeVoorCel(product.id, proces.id);
                    const zaaksoort = scope ? zaaksoortVanScope(scope) : undefined;
                    return (
                      <td
                        key={proces.id}
                        className={`scp-cel ${scope ? `scp-cel-${scope.type}` : 'scp-cel-leeg'}`}
                        onClick={() => openScopeModal(product.id, proces.id)}
                        title={scope ? `${zaaksoort?.naam ?? '?'} · ${scope.type}` : 'Klik om te koppelen'}
                      >
                        {scope && zaaksoort && (
                          <div className="scp-cel-inhoud">
                            {zaaksoort.icoon && <span className="scp-cel-icoon">{zaaksoort.icoon}</span>}
                            <span className="scp-cel-naam">{zaaksoort.naam}</span>
                            <span className={`scp-type-badge scp-type-${scope.type}`}>{scope.type}</span>
                          </div>
                        )}
                        {!scope && <span className="scp-cel-plus">+</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Zaaksoorten overzicht + hoofdproces */}
      {zaaksoorten.length > 0 && (
        <div className="scp-zaaksoorten-wrap">
          <div className="scp-sectie-header">
            <span className="scp-sectie-label">ZAAKSOORTEN — HOOFDPROCES</span>
          </div>
          <div className="scp-zaaksoort-lijst">
            {zaaksoorten.map(z => {
              const scopeCount = scopes.filter(s => s.zaaksoortId === z.id).length;
              return (
                <div key={z.id} className={`scp-zaaksoort-item ${scopeCount === 0 ? 'scp-geen-scope' : ''}`}>
                  <div className="scp-zaaksoort-naam">
                    {z.icoon && <span>{z.icoon}</span>}
                    <strong>{z.naam}</strong>
                    {scopeCount === 0 && <span className="scp-waarschuwing" title="Scope nog niet ingericht">⚠ Scope ontbreekt</span>}
                  </div>
                  <div className="scp-zaaksoort-meta">
                    <span>{scopeCount} combinatie{scopeCount !== 1 ? 's' : ''}</span>
                    <label className="scp-hoofdproces-label">
                      Hoofdproces:
                      <select
                        value={z.hoofdprocesId ?? ''}
                        onChange={e => stelHoofdprocesIn(z.id, e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">— geen —</option>
                        {processen.map(p => <option key={p.id} value={p.id}>{p.naam}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actieknoppen onderaan */}
      <div className="scp-acties">
        <button className="btn-secondary" onClick={openNieuwProduct}>+ Product</button>
        <button className="btn-secondary" onClick={openNieuwProces}>+ Proces</button>
      </div>

      {/* Modal: product */}
      {productModal && (
        <Modal
          title={productModal === 'nieuw' ? 'Nieuw product' : `Bewerken — ${(productModal as Product).naam}`}
          onClose={() => setProductModal(null)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              {productModal !== 'nieuw' && (
                <button
                  className="btn-secondary"
                  style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  disabled={saving}
                  title="Verberg dit product — het blijft bewaard maar verschijnt niet meer in de matrix"
                  onClick={async () => {
                    await updateProduct(id, (productModal as Product).id, { naam: productForm.naam, actief: false });
                    setProductModal(null);
                    laad();
                  }}
                >
                  Verbergen
                </button>
              )}
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button className="btn-secondary" onClick={() => setProductModal(null)} disabled={saving}>Annuleren</button>
                <button className="btn-primary" onClick={slaProductOp} disabled={saving || !productForm.naam}>{saving ? 'Bezig…' : 'Opslaan'}</button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="form-row">
              <label>Naam</label>
              <input autoFocus value={productForm.naam} onChange={e => setProductForm(f => ({ ...f, naam: e.target.value }))} placeholder="bv. Aanvraag" />
            </div>
            <div className="form-row">
              <label>Omschrijving</label>
              <input value={productForm.omschrijving} onChange={e => setProductForm(f => ({ ...f, omschrijving: e.target.value }))} placeholder="Optioneel" />
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: proces */}
      {procesModal && (
        <Modal
          title={procesModal === 'nieuw' ? 'Nieuw proces' : `Bewerken — ${(procesModal as Proces).naam}`}
          onClose={() => setProcesModal(null)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              {procesModal !== 'nieuw' && (
                <button
                  className="btn-secondary"
                  style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  disabled={saving}
                  title="Verberg dit proces — het blijft bewaard maar verschijnt niet meer in de matrix"
                  onClick={async () => {
                    await updateProces(id, (procesModal as Proces).id, { naam: procesForm.naam, actief: false });
                    setProcesModal(null);
                    laad();
                  }}
                >
                  Verbergen
                </button>
              )}
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button className="btn-secondary" onClick={() => setProcesModal(null)} disabled={saving}>Annuleren</button>
                <button className="btn-primary" onClick={slaProcesOp} disabled={saving || !procesForm.naam}>{saving ? 'Bezig…' : 'Opslaan'}</button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="form-row">
              <label>Naam</label>
              <input autoFocus value={procesForm.naam} onChange={e => setProcesForm(f => ({ ...f, naam: e.target.value }))} placeholder="bv. Aanvraag" />
            </div>
            <div className="form-row">
              <label>Omschrijving</label>
              <input value={procesForm.omschrijving} onChange={e => setProcesForm(f => ({ ...f, omschrijving: e.target.value }))} placeholder="Optioneel" />
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: scope koppeling */}
      {scopeModal && (
        <Modal
          title={`Koppeling — ${matrix.producten.find(p => p.id === scopeModal.productId)?.naam} × ${matrix.processen.find(p => p.id === scopeModal.procesId)?.naam}`}
          onClose={() => setScopeModal(null)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              {scopeModal.bestaand && (
                <button className="btn-secondary" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  onClick={() => verwijderScope(scopeModal.bestaand!.id)} disabled={saving}>
                  Verwijderen
                </button>
              )}
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button className="btn-secondary" onClick={() => setScopeModal(null)} disabled={saving}>Annuleren</button>
                <button className="btn-primary" onClick={slaScopeOp} disabled={saving || scopeForm.zaaksoortId === 0}>{saving ? 'Bezig…' : 'Opslaan'}</button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="form-row">
              <label>Zaaksoort</label>
              <select value={scopeForm.zaaksoortId} onChange={e => setScopeForm(f => ({ ...f, zaaksoortId: Number(e.target.value) }))}>
                <option value={0}>— kies zaaksoort —</option>
                {zaaksoorten.map(z => <option key={z.id} value={z.id}>{z.icoon ? `${z.icoon} ` : ''}{z.naam}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Type</label>
              <select value={scopeForm.type} onChange={e => setScopeForm(f => ({ ...f, type: e.target.value as ScopeType }))}>
                <option value="verplicht">Verplicht</option>
                <option value="optioneel">Optioneel</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-row">
                <label>Frequentieperiode</label>
                <select value={scopeForm.frequentiePeriode} onChange={e => setScopeForm(f => ({ ...f, frequentiePeriode: e.target.value }))}>
                  <option value="">— onbekend —</option>
                  {FREQUENTIE_PERIODES.map(fp => <option key={fp} value={fp}>{fp.charAt(0).toUpperCase() + fp.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>Frequentie</label>
                <input type="number" value={scopeForm.frequentie} onChange={e => setScopeForm(f => ({ ...f, frequentie: e.target.value }))} placeholder="bv. 250" step="any" min="0" />
              </div>
            </div>
            {fout && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-danger)', background: 'var(--color-danger-light)', padding: '6px 10px', borderRadius: 4 }}>
                {fout}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
