interface DataPoint { label: string; value: number; }

interface Props {
  data: DataPoint[];
  normWaarde?: number;
  eenheid?: string;
  width?: number;
  height?: number;
}

const PAD = { top: 16, right: 16, bottom: 32, left: 48 };

export function TrendChart({ data, normWaarde, eenheid = '', width = 400, height = 160 }: Props) {
  if (data.length === 0) return <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Geen metingen</span>;

  const W = width - PAD.left - PAD.right;
  const H = height - PAD.top - PAD.bottom;
  const values = data.map(d => d.value);
  const allValues = normWaarde !== undefined ? [...values, normWaarde] : values;
  const min = Math.min(...allValues) * 0.9;
  const max = Math.max(...allValues) * 1.1;
  const range = max - min || 1;

  const xOf = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * W;
  const yOf = (v: number) => PAD.top + H - ((v - min) / range) * H;

  const points = data.map((d, i) => `${xOf(i)},${yOf(d.value)}`).join(' ');

  return (
    <svg width={width} height={height} style={{ fontFamily: 'var(--font-sans)', overflow: 'visible' }}>
      {/* Y axis labels */}
      {[0, 0.5, 1].map(t => {
        const v = min + t * range;
        const y = yOf(v);
        return (
          <g key={t}>
            <line x1={PAD.left} x2={PAD.left + W} y1={y} y2={y} stroke="var(--color-border)" strokeDasharray="3 3" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={10} fill="var(--color-text-muted)">
              {v.toFixed(0)}{eenheid}
            </text>
          </g>
        );
      })}
      {/* Norm line */}
      {normWaarde !== undefined && (
        <line x1={PAD.left} x2={PAD.left + W} y1={yOf(normWaarde)} y2={yOf(normWaarde)}
          stroke="var(--color-warning)" strokeWidth={1.5} strokeDasharray="6 3" />
      )}
      {/* Data line */}
      <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots + x labels */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xOf(i)} cy={yOf(d.value)} r={3} fill="var(--color-primary)" />
          <text x={xOf(i)} y={PAD.top + H + 16} textAnchor="middle" fontSize={10} fill="var(--color-text-muted)">{d.label}</text>
        </g>
      ))}
    </svg>
  );
}
