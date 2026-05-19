import type { Zaaksoort, Proces } from '../api/client';
import './KlantreisStrip.css';

interface KlantreisStripProps {
  zaaksoorten: Zaaksoort[];
  processen: Proces[];
  // Single-select modus (InrichtingPage, VeranderingenPage)
  selectedId?: number;
  onSelect?: (id: number) => void;
  // Multi-select modus (StrategiePage)
  selectedIds?: number[];
  onToggle?: (id: number) => void;
  // Extra knop (InrichtingPage)
  onAdd?: () => void;
  // Drag handlers (InrichtingPage)
  dragId?: number | null;
  dragOverId?: number | null;
  onDragStart?: (e: React.DragEvent, id: number) => void;
  onDragOver?: (e: React.DragEvent, id: number) => void;
  onDrop?: (e: React.DragEvent, id: number) => void;
  onDragEnd?: () => void;
  onEditZaaksoort?: (z: Zaaksoort, e: React.MouseEvent) => void;
}

export function KlantreisStrip({
  zaaksoorten, processen,
  selectedId, onSelect,
  selectedIds, onToggle,
  onAdd,
  dragId, dragOverId, onDragStart, onDragOver, onDrop, onDragEnd,
  onEditZaaksoort,
}: KlantreisStripProps) {
  const multiSelect = !!onToggle;

  // Groepeer zaaksoorten per hoofdproces (gesorteerd op volgorde)
  const groepen: { proces: Proces | null; zaaksoorten: Zaaksoort[] }[] = [];

  // Eerst: zaaksoorten gegroepeerd per proces in volgorde
  for (const proces of processen) {
    const zs = zaaksoorten.filter(z => z.hoofdprocesId === proces.id);
    if (zs.length > 0) groepen.push({ proces, zaaksoorten: zs });
  }

  // Daarna: zaaksoorten zonder hoofdproces
  const zonder = zaaksoorten.filter(z => !z.hoofdprocesId);
  if (zonder.length > 0) groepen.push({ proces: null, zaaksoorten: zonder });

  // Als er helemaal geen processen zijn, toon alle zaaksoorten plat
  const plat = processen.length === 0;

  const renderChip = (z: Zaaksoort, showEdit: boolean) => {
    const isSelected = multiSelect ? selectedIds?.includes(z.id) : selectedId === z.id;
    const isDragging = dragId === z.id;
    const isDragOver = dragOverId === z.id;

    const chip = (
      <div
        className={[
          'ks-chip',
          isSelected ? 'ks-chip-selected' : '',
          isDragging ? 'ks-chip-dragging' : '',
          isDragOver ? 'ks-chip-dragover' : '',
          multiSelect ? 'ks-chip-multi' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => {
          if (multiSelect) onToggle?.(z.id);
          else onSelect?.(z.id);
        }}
      >
        {multiSelect && (
          <input type="checkbox" className="ks-check" checked={isSelected} readOnly />
        )}
        {!multiSelect && onDragStart && (
          <span className="ks-drag-handle" title="Slepen om te herordenen">⠿</span>
        )}
        {z.icoon && <span className="ks-icoon">{z.icoon}</span>}
        <span className="ks-naam">{z.naam}</span>
        {z.behandeling && <span className="ks-behandeling">{z.behandeling}</span>}
        {showEdit && onEditZaaksoort && (
          <button
            className="ks-edit-btn"
            onClick={e => { e.stopPropagation(); onEditZaaksoort(z, e); }}
            title="Zaaksoort bewerken"
          >✎</button>
        )}
      </div>
    );

    if (!multiSelect && onDragStart) {
      return (
        <div
          key={z.id}
          className="ks-chip-wrap"
          draggable
          onDragStart={e => onDragStart(e, z.id)}
          onDragOver={e => onDragOver?.(e, z.id)}
          onDrop={e => onDrop?.(e, z.id)}
          onDragEnd={onDragEnd}
        >
          {chip}
        </div>
      );
    }

    return <div key={z.id} className="ks-chip-wrap">{chip}</div>;
  };

  if (plat) {
    // Geen processen: platte strip (backward compat)
    return (
      <div className="ks-root">
        <div className="ks-header">
          <span className="ks-label">KLANTREIS (ZAAKSOORTEN)</span>
          {onAdd && <button className="ip-add-sm-btn" onClick={onAdd}>+ Zaaksoort</button>}
        </div>
        <div className="ks-strip-plat">
          {zaaksoorten.map((z, i) => (
            <div key={z.id} className="ks-plat-item">
              {renderChip(z, true)}
              {i < zaaksoorten.length - 1 && <span className="ks-arrow">›</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ks-root">
      <div className="ks-header">
        <span className="ks-label">KLANTREIS</span>
        {onAdd && <button className="ip-add-sm-btn" onClick={onAdd}>+ Zaaksoort</button>}
      </div>
      <div className="ks-strip">
        {groepen.map((groep, gi) => (
          <div key={groep.proces?.id ?? 'overig'} className="ks-groep">
            {/* Proceslabel */}
            <div className="ks-proces-label">
              {groep.proces ? groep.proces.naam : 'Overig'}
            </div>
            {/* Zaaksoorten onder dit proces */}
            <div className="ks-groep-chips">
              {groep.zaaksoorten.map(z => renderChip(z, true))}
            </div>
            {/* Pijl naar volgend proces */}
            {gi < groepen.length - 1 && (
              <span className="ks-groep-arrow">›</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
