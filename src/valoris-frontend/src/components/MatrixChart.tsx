import { useCallback, useEffect, useRef, useState } from 'react';
import type { ZaaksoortStrategie } from '../api/client';

interface Props {
  zaaksoorten: ZaaksoortStrategie[];
  selectedIds: number[];
  interventiedrempel?: number;
}

interface TooltipState {
  x: number;
  y: number;
  zaaksoort: ZaaksoortStrategie;
}

const MARGIN = { top: 20, right: 20, bottom: 48, left: 48 };
const R = 14;

function scoreColor(score: number): string {
  if (score >= 75) return '#0e9f6e';
  if (score >= 50) return '#c27803';
  return '#e02424';
}

export function MatrixChart({ zaaksoorten, selectedIds, interventiedrempel = 60 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 480, height: 360 });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setSize({ width: w, height: Math.round(w * 0.72) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const { width, height } = size;

  const getHitZaaksoort = useCallback((clientX: number, clientY: number): ZaaksoortStrategie | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const W = width - MARGIN.left - MARGIN.right;
    const H = height - MARGIN.top - MARGIN.bottom;
    const xOf = (v: number) => MARGIN.left + (v / 100) * W;
    const yOf = (v: number) => MARGIN.top + H - (v / 100) * H;
    const selected = zaaksoorten.filter(z => selectedIds.includes(z.zaaksoortId));
    for (const z of selected) {
      const dx = mx - xOf(z.inrichtingScore);
      const dy = my - yOf(z.prestatieScore);
      if (dx * dx + dy * dy <= (R + 4) * (R + 4)) return z;
    }
    return null;
  }, [zaaksoorten, selectedIds, width, height]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const z = getHitZaaksoort(e.clientX, e.clientY);
    if (z) {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, zaaksoort: z });
      canvas.style.cursor = 'pointer';
    } else {
      setTooltip(null);
      canvasRef.current!.style.cursor = 'default';
    }
  }, [getHitZaaksoort]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    if (canvasRef.current) canvasRef.current.style.cursor = 'default';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const W = width - MARGIN.left - MARGIN.right;
    const H = height - MARGIN.top - MARGIN.bottom;
    const xOf = (v: number) => MARGIN.left + (v / 100) * W;
    const yOf = (v: number) => MARGIN.top + H - (v / 100) * H;

    // Interventiedrempel zone (rood kwadrant linksonder)
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#e02424';
    ctx.fillRect(xOf(0), yOf(interventiedrempel), (interventiedrempel / 100) * W, (interventiedrempel / 100) * H);
    ctx.restore();

    // Grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach(t => {
      ctx.beginPath(); ctx.moveTo(xOf(t), MARGIN.top); ctx.lineTo(xOf(t), MARGIN.top + H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(MARGIN.left, yOf(t)); ctx.lineTo(MARGIN.left + W, yOf(t)); ctx.stroke();
    });

    // Diagonaal IST=SOLL
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(xOf(0), yOf(0)); ctx.lineTo(xOf(100), yOf(100)); ctx.stroke();
    ctx.setLineDash([]);

    // Aswaarden
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    [0, 25, 50, 75, 100].forEach(t => {
      ctx.fillText(`${t}`, xOf(t), MARGIN.top + H + 16);
    });
    ctx.textAlign = 'right';
    [0, 25, 50, 75, 100].forEach(t => {
      ctx.fillText(`${t}`, MARGIN.left - 6, yOf(t) + 4);
    });

    // Astitels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Inrichting (X-as)', xOf(50), height - 6);
    ctx.save();
    ctx.translate(13, yOf(50));
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Prestatie (Y-as)', 0, 0);
    ctx.restore();

    // Data punten (alleen geselecteerde)
    const selected = zaaksoorten.filter(z => selectedIds.includes(z.zaaksoortId));
    selected.forEach((z) => {
      const x = xOf(z.inrichtingScore);
      const y = yOf(z.prestatieScore);
      const vx = xOf(z.vectorInrichtingScore);
      const vy = yOf(z.vectorPrestatieScore);
      const color = scoreColor(z.istScore);

      // Verandervector pijl
      const hasvector = Math.abs(z.vectorInrichtingScore - z.inrichtingScore) > 0.5
                     || Math.abs(z.vectorPrestatieScore - z.prestatieScore) > 0.5;
      if (hasvector) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(vx, vy);
        ctx.stroke();
        const angle = Math.atan2(vy - y, vx - x);
        const arrowSize = 6;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(vx - arrowSize * Math.cos(angle - 0.4), vy - arrowSize * Math.sin(angle - 0.4));
        ctx.lineTo(vx - arrowSize * Math.cos(angle + 0.4), vy - arrowSize * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
      }

      // IST punt
      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Volgorde getal in cirkel
      ctx.fillStyle = '#fff';
      ctx.font = `bold 11px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${z.volgorde}`, x, y + 4);

      // Naam label onder
      ctx.fillStyle = '#374151';
      ctx.font = '10px system-ui, sans-serif';
      const label = z.zaaksoortNaam.length > 16 ? z.zaaksoortNaam.slice(0, 15) + '…' : z.zaaksoortNaam;
      ctx.fillText(label, x, y + R + 13);
    });
  }, [zaaksoorten, selectedIds, interventiedrempel, width, height]);

  const tz = tooltip?.zaaksoort;

  return (
    <div ref={wrapRef} style={{ width: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && tz && (
        <div style={{
          position: 'absolute',
          left: tooltip.x + 16,
          top: tooltip.y - 8,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
          pointerEvents: 'none',
          zIndex: 10,
          minWidth: 160,
          fontSize: 12,
          lineHeight: 1.6,
          color: '#111827',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {tz.icoon && <span style={{ marginRight: 4 }}>{tz.icoon}</span>}
            {tz.zaaksoortNaam}
          </div>
          <div style={{ color: '#6b7280', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0 8px' }}>
            <span>IST</span><span style={{ fontWeight: 600, color: scoreColor(tz.istScore) }}>{Math.round(tz.istScore)}</span>
            <span>SOLL</span><span style={{ fontWeight: 600 }}>{Math.round(tz.sollScore)}</span>
            <span>GAP</span><span style={{ fontWeight: 600, color: '#e02424' }}>{Math.round(tz.sollScore - tz.istScore)}</span>
            <span>Inrichting</span><span>{Math.round(tz.inrichtingScore)}</span>
            <span>Prestatie</span><span>{Math.round(tz.prestatieScore)}</span>
          </div>
          {tz.gekoppeldeVerandering && (
            <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
              {tz.gekoppeldeVerandering}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
